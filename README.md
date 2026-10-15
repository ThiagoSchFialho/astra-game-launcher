# Astra game launcher

## API

Base URL: `http://localhost:3000` (ou a porta definida em `process.env.PORT`)

Todas as respostas de erro seguem o formato `{ "error": "mensagem" }` (ou `{ "message": "mensagem" }` para "não encontrado"), com status codes:

| Status | Significado |
|--------|-------------|
| `200`  | Sucesso (GET, DELETE) |
| `201`  | Sucesso (POST, PUT) |
| `400`  | Dados obrigatórios não informados |
| `404`  | Recurso não encontrado |
| `409`  | Conflito (recurso já existe) |
| `500`  | Erro interno do servidor |

---

### Health Check

| Método | Rota | Descrição |
|--------|------|-----------|
| GET    | `/`  | Verifica se a API está rodando |

**GET /**
```json
{ "message": "API rodando!" }
```

---

### Users

Gerencia o usuário único do app (integração com Steam).

| Método | Rota      | Descrição |
|--------|-----------|-----------|
| POST   | `/users`  | Cria o usuário |
| GET    | `/users`  | Retorna o usuário |
| PUT    | `/users`  | Atualiza a `steam_api_key` do usuário |
| DELETE | `/users`  | Remove o usuário |

**POST /users**
```json
// body
{
  "steam_id": "76561198000000000",
  "steam_api_key": "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
}
```
- `400` se `steam_id` ou `steam_api_key` não forem informados.
- `409` se já existir um usuário com esse `steam_id`.

**GET /users**
- Retorna o usuário cadastrado.
- `404` se nenhum usuário existir.

**PUT /users**
```json
// body
{
  "steam_api_key": "NOVA_CHAVE_AQUI"
}
```
- `400` se `steam_api_key` não for informada.
- `404` se o usuário não existir.

**DELETE /users**
```json
// body
{
  "steam_id": "76561198000000000"
}
```
- `400` se `steam_id` não for informado.

---

### Games

CRUD de jogos.

| Método | Rota                  | Descrição |
|--------|------------------------|-----------|
| POST   | `/games`               | Cria um jogo |
| GET    | `/games`               | Lista todos os jogos |
| GET    | `/games?steam_id=<id>` | Busca um jogo pelo `steam_id` |
| GET    | `/games/:id`           | Busca um jogo pelo `id` |
| PUT    | `/games/:id`           | Atualiza um jogo |
| DELETE | `/games/:id`           | Remove um jogo |

**POST /games**
```json
// body
{
  "title": "Portal 2",
  "steam_id": 620,
  "developer": "Valve",
  "release_date": "2011-04-19",
  "playtime": 345,
  "status": "completed",
  "cover_square": "https://...",   // opcional
  "cover_hero": "https://...",     // opcional
  "cover_grid": "https://...",     // opcional
  "personal_rating": 5             // opcional
}
```
- `400` se algum campo obrigatório (`title`, `steam_id`, `developer`, `release_date`, `playtime`, `status`) não for informado.

**GET /games**
- Sem query params: lista todos os jogos. `404` se não houver nenhum.
- Com `?steam_id=<id>`: retorna um único jogo. `404` se não encontrado.

**GET /games/:id**
- `404` se o jogo não existir.

**PUT /games/:id**
- Mesmo body do POST (todos os campos obrigatórios devem ser reenviados).
- `400` se algum campo obrigatório faltar.
- `404` se o jogo não existir.

**DELETE /games/:id**
- `404`/`500` se não for encontrado ao excluir (ver observação abaixo).

> ⚠️ Observação: no `DELETE /games/:id`, a resposta de erro usa a chave `erro` (em português) em vez de `error`, diferente das demais rotas — vale padronizar.

---

### Genres

CRUD de gêneros.

| Método | Rota            | Descrição |
|--------|------------------|-----------|
| POST   | `/genres`        | Cria um gênero |
| GET    | `/genres`        | Lista todos os gêneros |
| GET    | `/genres/:id`    | Busca um gênero pelo `id` |
| PUT    | `/genres/:id`    | Atualiza um gênero |
| DELETE | `/genres/:id`    | Remove um gênero |

**POST /genres**
```json
// body
{ "name": "Puzzle" }
```
- `400` se `name` não for informado.

**PUT /genres/:id**
```json
// body
{ "name": "Puzzle-Platformer" }
```
- `400` se `name` não for informado.
- `404` se o gênero não existir.

---

### Collections

CRUD de coleções, com opção de retornar os jogos aninhados.

| Método | Rota                        | Descrição |
|--------|------------------------------|-----------|
| POST   | `/collections`               | Cria uma coleção |
| GET    | `/collections`               | Lista todas as coleções (sem jogos) |
| GET    | `/collections/with-games`    | Lista todas as coleções, cada uma com seus jogos aninhados |
| GET    | `/collections/:id`           | Busca uma coleção pelo `id` (sem jogos) |
| PUT    | `/collections/:id`           | Atualiza uma coleção |
| DELETE | `/collections/:id`           | Remove uma coleção |

**POST /collections**
```json
// body
{ "title": "Valve" }
```
- `400` se `title` não for informado.

**GET /collections**
```json
[
  { "id": "2", "title": "Valve" },
  { "id": "3", "title": "Doom" }
]
```

**GET /collections/with-games**
```json
[
  {
    "id": "2",
    "title": "Valve",
    "games": [
      {
        "id": "2",
        "title": "portal",
        "steam_id": "400",
        "cover_square": "https://...",
        "cover_hero": "https://...",
        "cover_grid": "https://...",
        "developer": "valve",
        "release_date": "2007-10-10T03:00:00.000Z",
        "personal_rating": 5,
        "playtime": 231,
        "status": "completed"
      }
    ]
  }
]
```
- Coleções sem jogos retornam `"games": []`.
- `404` se não houver nenhuma coleção.

> ⚠️ Importante: essa rota é registrada **antes** de `GET /collections/:id` no router, para que `/collections/with-games` não seja interpretado como um `:id`.

**PUT /collections/:id**
```json
// body
{ "title": "Novo título" }
```
- `400` se `title` não for informado.
- `404` se a coleção não existir.

---

### Collection Games

Relação N:N entre `collections` e `games`.

| Método | Rota                     | Descrição |
|--------|---------------------------|-----------|
| POST   | `/collection-games`       | Associa um jogo a uma coleção |
| GET    | `/collection-games`       | Lista todas as associações |
| GET    | `/collection-games/:id`   | Busca uma associação pelo `id` |
| PUT    | `/collection-games/:id`   | Atualiza uma associação |
| DELETE | `/collection-games/:id`   | Remove uma associação |

**POST /collection-games**
```json
// body
{ "collection_id": 2, "game_id": 5 }
```
- `400` se `collection_id` ou `game_id` não forem informados.

**PUT /collection-games/:id**
```json
// body
{ "collection_id": 2, "game_id": 6 }
```
- `400` se `collection_id` ou `game_id` não forem informados.
- `404` se a associação não existir.

---

### Game Genres

Relação N:N entre `games` e `genres`.

| Método | Rota                | Descrição |
|--------|----------------------|-----------|
| POST   | `/game-genres`       | Associa um gênero a um jogo |
| GET    | `/game-genres`       | Lista todas as associações |
| GET    | `/game-genres/:id`   | Busca uma associação pelo `id` |
| PUT    | `/game-genres/:id`   | Atualiza uma associação |
| DELETE | `/game-genres/:id`   | Remove uma associação |

**POST /game-genres**
```json
// body
{ "game_id": 5, "genre_id": 3 }
```
- `400` se `game_id` ou `genre_id` não forem informados.

**PUT /game-genres/:id**
```json
// body
{ "game_id": 5, "genre_id": 4 }
```
- `400` se `game_id` ou `genre_id` não forem informados.
- `404` se a associação não existir.
