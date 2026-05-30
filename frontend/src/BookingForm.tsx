import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch } from './hooks/index';
import { addToast } from './store/toastSlice';

// ── Validation Schema ─────────────────────────────────────────────────────────
const step1Schema = yup.object({
  name: yup.string()
    .required('Введите ваше имя')
    .min(2, 'Имя должно быть не менее 2 символов')
    .max(50, 'Имя слишком длинное'),
  phone: yup.string()
    .required('Введите номер телефона')
    .matches(/^(\+7|8)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/, 'Неверный формат телефона'),
  email: yup.string()
    .email('Неверный формат email')
    .required('Введите email'),
});

const step2Schema = yup.object({
  plan: yup.string().required('Выберите тариф'),
  startDate: yup.string().required('Выберите дату начала'),
  comment: yup.string().max(200, 'Комментарий не более 200 символов'),
});

const step3Schema = yup.object({
  consent1: yup.boolean().oneOf([true], 'Необходимо принять соглашение'),
  consent2: yup.boolean().oneOf([true], 'Необходимо подтвердить политику'),
});

type Step1Data = yup.InferType<typeof step1Schema>;
type Step2Data = yup.InferType<typeof step2Schema>;
type Step3Data = yup.InferType<typeof step3Schema>;

const PLANS = [
  { id: 'unlimited_12', label: '12 месяцев Безлимит', price: '8500₽' },
  { id: 'unlimited_6',  label: '6 месяцев Безлимит',  price: '4990₽' },
  { id: 'trainer_12',   label: '12 мес + тренер',      price: '7700₽' },
];

// ── Input Component ───────────────────────────────────────────────────────────
const FormInput: React.FC<{
  label: string;
  error?: string;
  placeholder?: string;
  type?: string;
  register: any;
}> = ({ label, error, placeholder, type = 'text', register }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{
      display: 'block', fontFamily: 'Inter,sans-serif',
      fontSize: 11, fontWeight: 500, letterSpacing: '.12em',
      textTransform: 'uppercase', color: error ? '#f87171' : 'rgba(255,255,255,.4)',
      marginBottom: 8,
    }}>{label}</label>
    <input
      {...register}
      type={type}
      placeholder={placeholder}
      style={{
        width: '100%', background: 'rgba(255,255,255,.05)',
        border: `1px solid ${error ? '#f87171' : 'rgba(255,255,255,.1)'}`,
        borderRadius: 10, padding: '13px 18px',
        fontFamily: 'Inter,sans-serif', fontSize: 14,
        color: '#fff', outline: 'none', boxSizing: 'border-box' as const,
        transition: 'border-color .2s',
      }}
    />
    {error && (
      <p style={{
        fontFamily: 'Inter,sans-serif', fontSize: 11,
        color: '#f87171', marginTop: 5, paddingLeft: 4,
      }}>{error}</p>
    )}
  </div>
);

// ── Main Booking Form ─────────────────────────────────────────────────────────
const BookingForm: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data>>({});
  const [submitted, setSubmitted] = useState(false);
  const dispatch = useAppDispatch();

  // Step 1 form
  const { register: reg1, handleSubmit: hs1, formState: { errors: e1 } } = useForm<Step1Data>({
    resolver: yupResolver(step1Schema),
    defaultValues: formData,
  });

  // Step 2 form
  const { register: reg2, handleSubmit: hs2, formState: { errors: e2 }, watch: watch2 } = useForm<Step2Data>({
    resolver: yupResolver(step2Schema),
    defaultValues: formData,
  });

  // Step 3 form
  const { register: reg3, handleSubmit: hs3, formState: { errors: e3 }, watch: watch3 } = useForm<Step3Data>({
    resolver: yupResolver(step3Schema),
  });

  const selectedPlan = watch2('plan');
  const c1 = watch3('consent1');
  const c2 = watch3('consent2');

  const onStep1 = (data: Step1Data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(2);
  };

  const onStep2 = (data: Step2Data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(3);
  };

  const onStep3 = (data: Step3Data) => {
    setSubmitted(true);
    dispatch(addToast({ message: '✅ Заявка отправлена! Ждём вас в Energy Flow!', type: 'success' }));
    setTimeout(() => {
      dispatch(addToast({ message: '📞 Менеджер свяжется с вами в течение часа', type: 'info' }));
    }, 2000);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,.05)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 10, padding: '13px 18px',
    fontFamily: 'Inter,sans-serif', fontSize: 14,
    color: '#fff', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color .2s',
  };

  const btnStyle: React.CSSProperties = {
    width: '100%', padding: 14, background: '#c8f000',
    border: 'none', borderRadius: 12,
    fontFamily: 'Inter,sans-serif', fontSize: 14,
    fontWeight: 600, color: '#0e0a06',
    cursor: 'pointer', transition: 'all .25s',
    marginTop: 8,
  };

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '30px 0' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(200,240,0,.12)', border: '2px solid #c8f000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 28,
        }}>✓</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: '#fff', marginBottom: 8 }}>
          Заявка отправлена!
        </div>
        <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.6 }}>
          Мы свяжемся с вами в ближайшее время.<br />Добро пожаловать в Energy Flow!
        </p>
        {onClose && (
          <button onClick={onClose} style={{ ...btnStyle, marginTop: 24, width: 'auto', padding: '12px 32px' }}>
            Закрыть
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[1,2,3].map(s => (
          <div key={s} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: s <= step ? '#c8f000' : 'rgba(255,255,255,.1)',
            transition: 'background .3s',
          }} />
        ))}
      </div>
      <div style={{
        fontFamily: 'Inter,sans-serif', fontSize: 11,
        color: 'rgba(255,255,255,.4)', letterSpacing: '.1em',
        textTransform: 'uppercase', marginBottom: 20,
      }}>
        Шаг {step} из 3 — {step === 1 ? 'Контактные данные' : step === 2 ? 'Выбор тарифа' : 'Подтверждение'}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <form onSubmit={hs1(onStep1)}>
          <FormInput label="Имя" placeholder="Ваше имя" register={reg1('name')} error={e1.name?.message} />
          <FormInput label="Телефон" placeholder="+7 (___) ___-__-__" type="tel" register={reg1('phone')} error={e1.phone?.message} />
          <FormInput label="Email" placeholder="your@email.com" type="email" register={reg1('email')} error={e1.email?.message} />
          <button type="submit" style={btnStyle}>Далее →</button>
        </form>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <form onSubmit={hs2(onStep2)}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: e2.plan ? '#f87171' : 'rgba(255,255,255,.4)', marginBottom: 10 }}>
              Тариф
            </label>
            {PLANS.map(plan => (
              <label key={plan.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', borderRadius: 10, marginBottom: 8, cursor: 'pointer',
                border: `1px solid ${selectedPlan === plan.id ? '#c8f000' : 'rgba(255,255,255,.1)'}`,
                background: selectedPlan === plan.id ? 'rgba(200,240,0,.08)' : 'rgba(255,255,255,.03)',
                transition: 'all .2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="radio" {...reg2('plan')} value={plan.id} style={{ accentColor: '#c8f000' }} />
                  <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 13, color: '#fff' }}>{plan.label}</span>
                </div>
                <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, color: '#c8f000' }}>{plan.price}</span>
              </label>
            ))}
            {e2.plan && <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#f87171', marginTop: 4 }}>{e2.plan.message}</p>}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: e2.startDate ? '#f87171' : 'rgba(255,255,255,.4)', marginBottom: 8 }}>
              Дата начала
            </label>
            <input type="date" {...reg2('startDate')} style={{ ...inputStyle, borderColor: e2.startDate ? '#f87171' : 'rgba(255,255,255,.1)', colorScheme: 'dark' }} />
            {e2.startDate && <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#f87171', marginTop: 5 }}>{e2.startDate.message}</p>}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontFamily: 'Inter,sans-serif', fontSize: 11, fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>
              Комментарий (необязательно)
            </label>
            <textarea {...reg2('comment')} placeholder="Пожелания или вопросы..." rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
            {e2.comment && <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#f87171', marginTop: 5 }}>{e2.comment.message}</p>}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={() => setStep(1)} style={{ ...btnStyle, background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: '#fff' }}>← Назад</button>
            <button type="submit" style={btnStyle}>Далее →</button>
          </div>
        </form>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <form onSubmit={hs3(onStep3)}>
          <div style={{ background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 12 }}>Ваша заявка:</div>
            {[
              { label: 'Имя', value: formData.name },
              { label: 'Телефон', value: formData.phone },
              { label: 'Email', value: formData.email },
              { label: 'Тариф', value: PLANS.find(p => p.id === formData.plan)?.label },
              { label: 'Дата начала', value: formData.startDate },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{row.label}</span>
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: '#fff', fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>

          {[
            { name: 'consent1' as const, text: 'Даю согласие на обработку персональных данных', error: e3.consent1 },
            { name: 'consent2' as const, text: 'Подтверждаю ознакомление с Политикой конфиденциальности', error: e3.consent2 },
          ].map(item => (
            <label key={item.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14, cursor: 'pointer' }}>
              <input type="checkbox" {...reg3(item.name)} style={{ marginTop: 2, accentColor: '#c8f000', width: 16, height: 16, flexShrink: 0 }} />
              <div>
                <span style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{item.text}</span>
                {item.error && <p style={{ fontFamily: 'Inter,sans-serif', fontSize: 11, color: '#f87171', marginTop: 3 }}>{item.error.message}</p>}
              </div>
            </label>
          ))}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={() => setStep(2)} style={{ ...btnStyle, background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: '#fff' }}>← Назад</button>
            <button type="submit" style={{ ...btnStyle, opacity: c1 && c2 ? 1 : 0.5 }}>Отправить заявку</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default BookingForm;
