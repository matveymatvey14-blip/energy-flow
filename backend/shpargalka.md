# ШПАРГАЛКА — Весь проект построчно

## 1. cmd/membership-service/main.go — Точка входа микросервиса абонементов

```go
func main() {
    cfg := config.Load()                          // Читает .env / переменные окружения
    log, err := logger.New()                      // Создаёт логгер (zap — быстрый структ. логгер от Uber)
    defer log.Sync()                              // При выходе сбрасывает буфер логов в stdout
    ctx, cancel := context.WithTimeout(...)        // Контекст с таймаутом 5 сек для подключения к БД
    defer cancel()                                // Отменяет контекст при выходе
    db, err := postgres.New(ctx, cfg.DSN())       // Подключается к PostgreSQL
    defer db.Close()                              // Закрывает БД при остановке сервера
    repo := membershippostgres.New(db)            // Создаёт репозиторий (слой БД)
    uc := membershipusecase.New(repo)             // Создаёт UseCase (бизнес-логика)
    handler := membershiphttp.New(uc)             // Создаёт HTTP handler
    router := mux.NewRouter()                     // Создаёт маршрутизатор HTTP запросов
    handler.Register(router)                      // Регистрирует эндпоинты /memberships
    http.ListenAndServe(":8082", router)          // Запускает сервер на порту 8082
}
```

**Ключевые вопросы:**
- **"Почему New() раздельно?"** — Dependency Injection. Каждый слой получает зависимость через конструктор, не создаёт её сам.
- **"Что такое defer?"** — Гарантирует выполнение функции при выходе (даже при панике).
- **"Зачем context.WithTimeout?"** — Чтобы БД подключение не висело вечно, если сервер упал.

---

## 2. internal/membership/domain/membership.go — Модель данных

```go
type Membership struct {
    ID           int64     `json:"id"`            // BIGSERIAL — автоинкремент
    UserID       int64     `json:"user_id"`       // Кому принадлежит (FK на users)
    PlanName     string    `json:"plan_name"`     // Название тарифа (Month, Year...)
    Price        int       `json:"price"`         // Цена (int — копейки/центы)
    ValidUntil   time.Time `json:"valid_until"`   // Действителен до
    PurchasedAt  time.Time `json:"purchased_at"`  // Когда куплен (default now() в БД)
}
```

**Ключевые вопросы:**
- **`int64` vs `int`?** — int64 гарантирует 64 бита на всех платформах.
- **Что такое `` `json:"id"` ``?** — Тег, говорит encoding/json как называть поле в JSON.
- **Почему поля с большой буквы?** — Публичные (экспортируемые), чтобы json мог читать/писать их.

---

## 3. internal/membership/delivery/http/handler.go — Слой HTTP

### Структура и конструктор

```go
type Handler struct {
    uc *usecase.UseCase            // Ссылка на бизнес-логику
}
func New(uc *usecase.UseCase) *Handler {
    return &Handler{uc: uc}        // Конструктор — сохраняет usecase внутри Handler
}
```

### Регистрация маршрутов

```go
func (h *Handler) Register(router *mux.Router) {
    router.HandleFunc("/memberships", h.purchase).Methods(http.MethodPost)   // POST → покупка
    router.HandleFunc("/memberships", h.listByUserID).Methods(http.MethodGet) // GET → список
}
```

- Один URL `/memberships`, два HTTP метода → разная логика.

### Структура запроса

```go
type purchaseRequest struct {
    UserID     int64  `json:"user_id"`
    PlanName   string `json:"plan_name"`
    Price      int    `json:"price"`
    ValidUntil string `json:"valid_until"`       // Строка! Потом парсим в time.Time
}
```

### purchase — покупка (построчно)

```go
func (h *Handler) purchase(w http.ResponseWriter, r *http.Request) {  // w — ответ, r — запрос
    var req purchaseRequest                                            // Объявляем переменную типа purchaseRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {       // Читаем JSON из тела запроса
        commonhttp.WriteError(w, 400, errors.New("invalid json"))      // Если не JSON — 400
        return
    }
    validUntil, err := time.Parse(time.RFC3339, req.ValidUntil)        // Парсим строку "2026-06-30T00:00:00Z" в time.Time
    if err != nil {
        commonhttp.WriteError(w, 400, errors.New("invalid valid_until"))
        return
    }
    created, err := h.uc.Purchase(r.Context(), domain.Membership{      // Вызываем бизнес-логику
        UserID: req.UserID, PlanName: req.PlanName,
        Price: req.Price, ValidUntil: validUntil,
    })
    if err != nil {
        commonhttp.WriteError(w, 400, err)                             // Если бизнес-логика вернула ошибку — 400
        return
    }
    commonhttp.WriteJSON(w, 201, created)                              // Успех → 201 Created + JSON
}
```

### listByUserID — список абонементов пользователя

```go
func (h *Handler) listByUserID(w http.ResponseWriter, r *http.Request) {
    userIDRaw := r.URL.Query().Get("user_id")           // Читает query-параметр ?user_id=123 из URL
    userID, err := strconv.ParseInt(userIDRaw, 10, 64)  // Превращает строку "123" → int64
    if err != nil {
        commonhttp.WriteError(w, 400, errors.New("invalid user_id"))
        return
    }
    items, err := h.uc.ListByUserID(r.Context(), userID) // Вызов бизнес-логики
    if err != nil {
        commonhttp.WriteError(w, 400, err)
        return
    }
    commonhttp.WriteJSON(w, 200, items)                   // Успех → 200 + массив JSON
}
```

---

## 4. internal/membership/usecase/usecase.go — Бизнес-логика

### Интерфейс репозитория

```go
type Repository interface {
    Create(ctx context.Context, membership domain.Membership) (domain.Membership, error)
    ListByUserID(ctx context.Context, userID int64) ([]domain.Membership, error)
}
```

**Контракт**: UseCase не знает какая БД (Postgres, Mongo, файл). Работает через интерфейс.

### Purchase — покупка (валидация + вызов БД)

```go
func (u *UseCase) Purchase(ctx context.Context, m domain.Membership) (domain.Membership, error) {
    if m.UserID <= 0 {                                                    // ID должен быть > 0
        return domain.Membership{}, errors.New("user_id must be positive")
    }
    if strings.TrimSpace(m.PlanName) == "" {                              // После удаления пробелов — не пусто?
        return domain.Membership{}, errors.New("plan_name is required")
    }
    if m.Price <= 0 {                                                     // Цена должна быть > 0
        return domain.Membership{}, errors.New("price must be positive")
    }
    if m.ValidUntil.Before(time.Now()) {                                  // Дата не в прошлом?
        return domain.Membership{}, errors.New("valid_until must be in the future")
    }
    return u.repo.Create(ctx, m)                                          // Если всё ок — в БД
}
```

**Ключевые вопросы:**
- **`domain.Membership{}`** — пустая структура (zero value), возвращается при ошибке.
- **`strings.TrimSpace()`** — обрезает пробелы/табуляцию с концов.
- **`.Before(time.Now())`** — сравнивает дату с текущим моментом.
- **Почему валидация тут, а не в хендлере?** — Если добавим Telegram бота, валидация не дублируется.

### ListByUserID

```go
func (u *UseCase) ListByUserID(ctx context.Context, userID int64) ([]domain.Membership, error) {
    if userID <= 0 {
        return nil, errors.New("user_id must be positive")
    }
    return u.repo.ListByUserID(ctx, userID)
}
```

---

## 5. internal/membership/repository/postgres/repository.go — Работа с БД

### Структура

```go
type Repository struct {
    db *sql.DB          // Пул соединений с PostgreSQL
}
func New(db *sql.DB) *Repository {
    return &Repository{db: db}
}
```

### Create — INSERT

```go
func (r *Repository) Create(ctx context.Context, m domain.Membership) (domain.Membership, error) {
    const query = `
        INSERT INTO memberships(user_id, plan_name, price, valid_until)
        VALUES ($1, $2, $3, $4)                              -- $1...$4 — плейсхолдеры (защита от SQL-инъекций)
        RETURNING id, user_id, plan_name, price, valid_until, purchased_at  -- PostgreSQL сразу возвращает вставленную строку
    `
    var created domain.Membership
    err := r.db.QueryRowContext(ctx, query,                  // QueryRowContext — 1 строка результата
        m.UserID, m.PlanName, m.Price, m.ValidUntil,         // Передаём значения вместо $1...$4
    ).Scan(                                                   // Scan — читает колонки результата в поля структуры
        &created.ID, &created.UserID, &created.PlanName,
        &created.Price, &created.ValidUntil, &created.PurchasedAt,
    )
    return created, err
}
```

### ListByUserID — SELECT

```go
func (r *Repository) ListByUserID(ctx context.Context, userID int64) ([]domain.Membership, error) {
    const query = `
        SELECT id, user_id, plan_name, price, valid_until, purchased_at
        FROM memberships
        WHERE user_id = $1                                    -- Фильтр по пользователю
        ORDER BY id DESC                                      -- Сначала новые
    `
    rows, err := r.db.QueryContext(ctx, query, userID)         // QueryContext — много строк
    if err != nil { return nil, err }
    defer rows.Close()                                         // Закроется при выходе (даже при панике)

    items := make([]domain.Membership, 0)                      // Пустой срез (динамический массив)
    for rows.Next() {                                          // Итерация по строкам результата
        var m domain.Membership
        if err := rows.Scan(                                   // Читаем колонки в структуру
            &m.ID, &m.UserID, &m.PlanName,
            &m.Price, &m.ValidUntil, &m.PurchasedAt,
        ); err != nil {
            return nil, err
        }
        items = append(items, m)                               // Добавляем в срез
    }
    return items, rows.Err()                                   // rows.Err() — ошибка во время итерации
}
```

**Ключевые вопросы:**
- **`$1, $2, $3, $4` — что это?** — Плейсхолдеры PostgreSQL. Данные передаются отдельно от SQL. Это защищает от SQL-инъекций.
- **`RETURNING`?** — Фича PostgreSQL. Вставляет строку И сразу возвращает её. Экономим один запрос.
- **`rows.Next()`?** — Переход к следующей строке. Возвращает false, когда строки кончились.
- **`defer rows.Close()`?** — Закрывает rows при выходе из функции. Иначе — утечка ресурсов.
- **`make([]domain.Membership, 0)`?** — Создаёт срез (slice) с длиной 0. `make` — встроенная функция для создания слайсов/мап/каналов.
- **`append(items, m)`?** — Добавляет элемент в конец среза. Если срез заполнен — Go сам выделяет новую память.

---

## 6. internal/common/http/response.go — Утилиты для ответов

```go
type ErrorResponse struct {
    Error string `json:"error"`     // {"error": "текст"}
}

func WriteJSON(w http.ResponseWriter, code int, payload any) {
    w.Header().Set("Content-Type", "application/json")     // Говорим клиенту: "это JSON"
    w.WriteHeader(code)                                     // Код ответа (200, 201, 400...)
    _ = json.NewEncoder(w).Encode(payload)                  // Превращаем any → JSON → пишем в ответ
}

func WriteError(w http.ResponseWriter, code int, err error) {
    WriteJSON(w, code, ErrorResponse{Error: err.Error()})  // Ошибка оборачивается в {"error": "..."}
}
```

**Ключевые вопросы:**
- **`any`** — псевдоним для `interface{}`. Любой тип.
- **`_ =`** — игнорируем ошибку (json.Encode почти всегда успешен).
- **`w.Header().Set(...)`** — устанавливает HTTP заголовок.

---

## 7. Тесты и моки

### internal/membership/usecase/usecase_test.go

```go
type repoMock struct {
    mock.Mock                              // Встраиваем testify/mock
}

func (m *repoMock) Create(ctx context.Context, m domain.Membership) (domain.Membership, error) {
    args := m.Called(ctx, m)               // testify записывает: "вызвали Create с такими аргументами"
    return args.Get(0).(domain.Membership), args.Error(1)  // Возвращаем то, что настроили
}

func TestPurchase_Success(t *testing.T) {
    repo := &repoMock{}
    uc := New(repo)
    input := domain.Membership{...}
    expected := input; expected.ID = 1

    repo.On("Create", mock.Anything, input).Return(expected, nil).Once()
    //   ↑ Когда вызовут Create с любым ctx и input → верни expected, nil, ровно 1 раз

    created, err := uc.Purchase(context.Background(), input)
    require.NoError(t, err)                // Упади если err != nil
    require.Equal(t, int64(1), created.ID) // Проверь что ID = 1
    repo.AssertExpectations(t)             // Убедись что Create вызвали (и только 1 раз)
}
```

**Ключевые вопросы:**
- **Почему мок?** — Юнит-тесты не должны трогать реальную БД. Мок эмулирует репозиторий.
- **`mock.Anything`** — "любое значение" (нас не интересует, какой именно контекст передали).
- **`.Once()`** — ожидаем ровно 1 вызов. Если будет 0 или 2 — тест упадёт.
- **`require.NoError`** — из testify. Удобные ассерты.

### internal/membership/repository/postgres/repository_test.go

```go
db, mock, err := sqlmock.New()            // Создаёт виртуальную БД (без PostgreSQL)

mock.ExpectQuery(regexp.QuoteMeta(`        // Ожидаем, что будет выполнен такой SQL
    INSERT INTO memberships(...)
    VALUES ($1, $2, $3, $4)
    RETURNING id, ...
`)).
    WithArgs(int64(1), "Month", 2500, validUntil).                    // С такими параметрами
    WillReturnRows(sqlmock.NewRows(...).AddRow(1, 1, "Month", ...))    // Вернёт такую строку
```

**Что это:** sqlmock — эмуляция `sql.DB`. Не нужна реальная PostgreSQL для теста.

---

## 8. user-пакет — для общего понимания

То же самое, что membership, только:
- Модель: `User {ID, FullName, Email, CreatedAt}`
- Эндпоинты: `POST /users`, `GET /users`
- UseCase: валидация `FullName` и `Email` не пустые
- Repository: `INSERT INTO users(full_name, email)`, `SELECT * FROM users`

Прочитать за 5 минут — почти копия.

---

## 9. internal/platform/ — инфраструктура

### config/config.go
```go
func Load() Config { return Config{
    DBHost: envOrDefault("POSTGRES_HOST", "localhost"),  // Читает переменную окружения ИЛИ "localhost"
}}
func envOrDefault(key, fallback string) string {
    if value := os.Getenv(key); value != "" { return value }
    return fallback
}
func (c Config) DSN() string { return fmt.Sprintf("host=%s port=%s ...", ...) }
```
**envOrDefault** — если переменная окружения не задана → берём значение по умолчанию.

### postgres/postgres.go
```go
db, err := sql.Open("postgres", dsn)     // Открыть драйвер (ленивое подключение)
db.SetMaxOpenConns(15)                    // Максимум 15 соединений одновременно
db.SetMaxIdleConns(5)                     // Максимум 5 простаивающих
db.PingContext(ctx)                       // Реально проверяет, что БД жива
```

### logger/logger.go
```go
cfg := zap.NewProductionConfig()          // Формат JSON для продакшна
cfg.OutputPaths = []string{"stdout"}      // Логи в консоль
```

---

## 10. Миграции

```sql
CREATE TABLE memberships (
    id BIGSERIAL PRIMARY KEY,              -- BIGSERIAL = автоинкремент int64
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    price INT NOT NULL CHECK (price > 0),
    valid_until TIMESTAMPTZ NOT NULL,      -- TIMESTAMPTZ = с часовым поясом
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**`ON DELETE CASCADE`** — удалили пользователя → его абонементы удалятся сами.
**`CHECK (price > 0)`** — база не даст вставить 0 или отрицательную цену.

---

## БЫСТРЫЙ СЛОВАРЬ ТЕРМИНОВ

| Термин | Что значит |
|--------|-----------|
| `struct` | Структура, аналог класса (только поля) |
| `func (r *Repository) Create(...)` | Метод на структуре Repository. `r` — получатель (this) |
| `interface` | Контракт: набор методов, которые тип должен реализовать |
| `*sql.DB` | Указатель на БД. Звёздочка = "ссылка на" |
| `&variable` | Взятие адреса (указатель на переменную) |
| `defer` | Отложенный вызов при выходе из функции |
| `make()` | Создание среза/мапы/канала |
| `append()` | Добавление в срез |
| `errors.New("text")` | Создание ошибки |
| `context.Context` | Контекст запроса (отмена, таймаут, метаданные) |
| `json.NewDecoder(r.Body).Decode(&v)` | Чтение JSON из запроса |
| `RETURNING` | Фича PostgreSQL — возвращает вставленную строку |
| `$1, $2` | Плейсхолдеры — защита от SQL-инъекций |
| `mock.Mock` | Библиотека testify — создание заглушек |
| DSN | Data Source Name — строка подключения к БД |
| Swagger | Документация API по адресу /swagger/ |
| gorilla/mux | HTTP маршрутизатор |
| zap | Логгер от Uber с поддержкой уровней |
