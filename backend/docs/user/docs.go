package user

import "github.com/swaggo/swag"

const docTemplate = `{
  "swagger": "2.0",
  "info": {
    "title": "User Service API",
    "version": "1.0"
  },
  "basePath": "/",
  "paths": {
    "/health": {
      "get": {
        "produces": ["text/plain"],
        "responses": {"200": {"description": "ok"}}
      }
    },
    "/users": {
      "get": {
        "produces": ["application/json"],
        "responses": {"200": {"description": "ok"}}
      },
      "post": {
        "consumes": ["application/json"],
        "produces": ["application/json"],
        "responses": {"201": {"description": "created"}}
      }
    }
  }
}`

type s struct{}

func (s *s) ReadDoc() string { return docTemplate }

func init() {
	swag.Register("swagger", &s{})
}
