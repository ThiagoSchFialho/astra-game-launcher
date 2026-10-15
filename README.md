# Astra Game Launcher

## API

API REST em Node.js, Express e TypeScript para gerenciar a biblioteca de
jogos, coleções, gêneros, conquistas e integração com a Steam. Também
expõe informações locais sobre instalações e execução de jogos Steam e
um fluxo de eventos em tempo real.

### Base URL

``` text
http://localhost:3000
```

A porta pode ser alterada pela variável de ambiente `PORT`.

### Configuração

A aplicação carrega variáveis de ambiente com `dotenv`. As variáveis
identificadas no código são:

  -----------------------------------------------------------------------
  Variável                            Finalidade
  ----------------------------------- -----------------------------------
  `PORT`                              Porta da API. Padrão: `3000`.

  `frontend_host`                     Origem permitida pelo CORS.

  `STEAM_PATH`                        Caminho opcional da instalação da
                                      Steam.

  `FRONT_PORT`                        Porta do frontend usada na
                                      validação de origem de
                                      `/system/shutdown`. Padrão: `4173`.

  `BROWSER_DEBUG_PORT`                Porta de depuração remota do
                                      navegador fechado durante o
                                      desligamento. Padrão: `9222`.
  -----------------------------------------------------------------------

A API espera JSON nos corpos das requisições
(`Content-Type: application/json`). O CORS permite os métodos `GET`,
`POST`, `PUT`, `DELETE` e `PATCH`, e o cabeçalho `Content-Type`.

### Convenções de resposta

As respostas de erro usam o formato abaixo:

``` json
{ "error": "Mensagem de erro." }
```

Consulte cada seção para os códigos específicos. A rota `DELETE /games/:id`
ainda pode retornar a chave `erro`, conforme observado na implementação. Listagens vazias frequentemente retornam `404`, em
vez de `200` com um array vazio.

### Códigos HTTP utilizados

  -----------------------------------------------------------------------
  Código                              Uso observado
  ----------------------------------- -----------------------------------
  `200`                               Operação concluída com sucesso.

  `201`                               Recurso criado por requisições
                                      `POST`.

  `207`                               Sincronização concluída
                                      parcialmente, com pelo menos um
                                      item contendo erro.

  `400`                               Campo obrigatório ausente ou valor
                                      inválido.

  `403`                               Origem ou endereço remoto não
                                      autorizado em `/system/shutdown`.

  `404`                               Recurso/usuário não encontrado ou
                                      listagem sem resultados, conforme a
                                      rota.

  `409`                               Usuário com o mesmo Steam ID já
                                      existe.

  `502`                               Falha ao consultar a Steam ou
                                      sincronizar uma conquista
                                      individual.

  `500`                               Erro interno ou falha operacional.
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Health check

  Método   Rota   Descrição
  -------- ------ -------------------------------------
  `GET`    `/`    Verifica se a API está em execução.

Resposta `200`:

``` json
{ "message": "API rodando!" }
```

------------------------------------------------------------------------

## Users

Gerencia o usuário usado pela integração com a Steam. A implementação
trabalha com um usuário principal.

  -----------------------------------------------------------------------
  Método                  Rota                    Descrição
  ----------------------- ----------------------- -----------------------
  `POST`                  `/users`                Cadastra o usuário
                                                  Steam.

  `GET`                   `/users`                Retorna o usuário
                                                  cadastrado.

  `PUT`                   `/users`                Atualiza a chave da API
                                                  Steam do usuário.

  `DELETE`                `/users`                Exclui o usuário pelo
                                                  Steam ID informado no
                                                  corpo.
  -----------------------------------------------------------------------

### `POST /users`

Body:

``` json
{
  "steam_id": "76561198000000000",
  "steam_api_key": "SUA_CHAVE_STEAM"
}
```

-   `201`: usuário criado.
-   `400`: `steam_id` ou `steam_api_key` ausente.
-   `409`: já existe usuário com esse Steam ID.
-   `500`: erro interno ou falha ao criar o usuário.

### `GET /users`

Retorna o usuário cadastrado.

-   `200`: usuário encontrado.
-   `404`: usuário não encontrado.
-   `500`: erro interno.

### `PUT /users`

Body:

``` json
{ "steam_api_key": "NOVA_CHAVE_STEAM" }
```

-   `200`: usuário atualizado.
-   `400`: chave ausente.
-   `404`: usuário não encontrado.
-   `500`: erro interno ou falha ao atualizar.

### `DELETE /users`

Body:

``` json
{ "steam_id": "76561198000000000" }
```

-   `200`: usuário excluído.
-   `400`: Steam ID ausente.
-   `500`: falha ao excluir ou erro interno.

------------------------------------------------------------------------

## Games

CRUD e operações específicas para jogos. O `steam_id` representa o App
ID do jogo na Steam.

  --------------------------------------------------------------------------------
  Método                  Rota                             Descrição
  ----------------------- -------------------------------- -----------------------
  `POST`                  `/games`                         Cria um jogo.

  `GET`                   `/games`                         Lista jogos ou busca
                                                           por Steam App ID.

  `GET`                   `/games?steam_id=:steam_id`      Busca um jogo pelo
                                                           Steam App ID.

  `GET`                   `/games/with-genres`             Lista jogos com gêneros
                                                           associados; aceita
                                                           `steam_id`.

  `GET`                   `/games/with-genres/:id`         Busca um jogo pelo ID
                                                           interno com gêneros.

  `GET`                   `/games/:id`                     Busca um jogo pelo ID
                                                           interno.

  `PUT`                   `/games/:id`                     Atualiza os dados do
                                                           jogo.

  `PATCH`                 `/games/:id/status`              Atualiza somente o
                                                           status.

  `PATCH`                 `/games/:id/hidden`              Atualiza se o jogo está
                                                           oculto.

  `PATCH`                 `/games/:id/beatable`            Atualiza se o jogo pode
                                                           ser zerado/concluído.

  `PATCH`                 `/games/:id/rtime_last_played`   Atualiza o horário Unix
                                                           da última vez que foi
                                                           jogado.

  `DELETE`                `/games/:id`                     Exclui um jogo.
  --------------------------------------------------------------------------------

### `POST /games`

Body mínimo observado:

``` json
{
  "title": "Portal 2",
  "steam_id": 620,
  "status": "played",
  "playtime": 345,
  "rtime_last_played": "0",
  "developer": "Valve",
  "release_date": "2011-04-19",
  "cover_square": "https://exemplo.com/portal2.jpg",
  "personal_rating": 5,
  "beatable": true,
  "hidden": false,
  "installed": true
}
```

Campos exigidos pela validação da rota: `title`, `steam_id` e `status`.
`playtime` tem padrão `0`; os demais campos mostrados são opcionais na
rota. O tipo esperado para `steam_id` é numérico. Os valores aceitos
para `status` não são restringidos explicitamente pelo handler.

-   `201`: jogo criado.
-   `400`: `title`, `steam_id` ou `status` ausente/falsy.
-   `500`: falha ao criar ou erro interno.

### Consultas

-   `GET /games`: retorna todos os jogos; se `steam_id` for informado,
    retorna somente o jogo correspondente.
-   `GET /games/with-genres`: mesma lógica, incluindo os gêneros
    associados.
-   `GET /games/with-genres/:id`: retorna um jogo com seus gêneros.
-   As rotas de consulta retornam `404` quando o jogo ou a listagem não
    têm resultados.

### `PUT /games/:id`

Reenvie pelo menos os campos obrigatórios `title`, `steam_id` e
`status`. A implementação também recebe `developer`, `release_date`,
`rtime_last_played`, `playtime`, `cover_square`, `personal_rating`,
`beatable`, `hidden` e `installed`.

-   `200`: atualização realizada.
-   `400`: ID ausente ou campo obrigatório ausente.
-   `404`: jogo não encontrado.
-   `500`: falha ao atualizar ou erro interno.

### Atualizações parciais

`PATCH /games/:id/status`

``` json
{ "status": "completed" }
```

`PATCH /games/:id/hidden`

``` json
{ "hidden": true }
```

`PATCH /games/:id/beatable`

``` json
{ "beatable": false }
```

`PATCH /games/:id/rtime_last_played`

``` json
{ "rtime_last_played": "1720000000" }
```

As três primeiras rotas exigem o campo correspondente; `hidden` e
`beatable` precisam ser booleanos. `rtime_last_played` precisa ser
string. Retornam `200` quando atualizadas, `400` para dados inválidos,
`404` se o jogo não for encontrado e `500` em erro interno.

### `DELETE /games/:id`

-   `200`: jogo excluído.
-   Em caso de falha de exclusão, o handler pode retornar `500` com a
    chave `erro`, diferentemente do padrão `error`.
-   Erros internos retornam `500`.

------------------------------------------------------------------------

## Genres

CRUD de gêneros.

  Método     Rota            Descrição
  ---------- --------------- ---------------------
  `POST`     `/genres`       Cria um gênero.
  `GET`      `/genres`       Lista gêneros.
  `GET`      `/genres/:id`   Busca um gênero.
  `PUT`      `/genres/:id`   Atualiza um gênero.
  `DELETE`   `/genres/:id`   Exclui um gênero.

### Criação e atualização

Body para `POST /genres` e `PUT /genres/:id`:

``` json
{ "name": "Puzzle" }
```

-   `POST`: `201` ao criar; `400` se `name` estiver ausente; `500` em
    erro.
-   `PUT`: `200` ao atualizar; `400` se `name` estiver ausente; `404` se
    o gênero não existir; `500` em erro.
-   `GET` retorna `200` com os dados ou `404` se não houver resultados.
-   `DELETE` retorna `200` ao excluir; a implementação retorna `500` se
    a exclusão não retornar um gênero.

------------------------------------------------------------------------

## Collections

Gerencia coleções de jogos. Há rotas que retornam apenas os dados da
coleção e outras que incluem jogos aninhados.

  -------------------------------------------------------------------------------
  Método                  Rota                            Descrição
  ----------------------- ------------------------------- -----------------------
  `POST`                  `/collections`                  Cria uma coleção.

  `GET`                   `/collections`                  Lista coleções sem
                                                          jogos aninhados.

  `GET`                   `/collections/with-games`       Lista coleções com seus
                                                          jogos.

  `GET`                   `/collections/:id`              Busca uma coleção pelo
                                                          ID.

  `GET`                   `/collections/:id/with-games`   Busca uma coleção com
                                                          seus jogos.

  `PUT`                   `/collections/:id`              Atualiza o título da
                                                          coleção.

  `DELETE`                `/collections/:id`              Exclui uma coleção.
  -------------------------------------------------------------------------------

### `POST /collections`

``` json
{ "title": "Valve" }
```

-   `201`: coleção criada.
-   `400`: `title` ausente.
-   `500`: erro interno ou falha ao criar.

### Consultas

`GET /collections/with-games` retorna uma lista de coleções com jogos
associados. Coleções sem jogos podem retornar `games: []`, dependendo
dos dados retornados pelo model.

As rotas de consulta retornam `404` quando não há coleção ou resultado
correspondente.

### `PUT /collections/:id`

``` json
{ "title": "Minha coleção" }
```

-   `200`: coleção atualizada.
-   `400`: `title` ausente.
-   `404`: coleção não encontrada.
-   `500`: erro interno ou falha ao atualizar.

`DELETE /collections/:id` retorna `200` ao excluir e `500` em caso de
falha.

------------------------------------------------------------------------

## Collection Games

Gerencia a relação entre coleções e jogos.

  ------------------------------------------------------------------------------
  Método                  Rota                           Descrição
  ----------------------- ------------------------------ -----------------------
  `POST`                  `/collection-games`            Associa um jogo a uma
                                                         coleção.

  `GET`                   `/collection-games`            Lista associações.

  `GET`                   `/collection-games/game/:id`   Busca associações pelo
                                                         ID do jogo.

  `GET`                   `/collection-games/:id`        Busca uma associação
                                                         pelo ID da relação.

  `PUT`                   `/collection-games/:id`        Atualiza uma
                                                         associação.

  `DELETE`                `/collection-games/relation`   Exclui uma associação
                                                         por `game_id` e
                                                         `collection_id`.

  `DELETE`                `/collection-games/:id`        Exclui uma associação
                                                         pelo ID da relação.
  ------------------------------------------------------------------------------

### Criar associação

``` json
{ "collection_id": 2, "game_id": 5 }
```

-   `201`: associação criada.
-   `400`: `collection_id` ou `game_id` ausente/falsy.
-   `500`: erro interno ou falha ao criar.

### Atualizar associação

`PUT /collection-games/:id` usa o mesmo corpo:

``` json
{ "collection_id": 2, "game_id": 6 }
```

Retorna `200` ao atualizar, `400` se os IDs estiverem ausentes, `404` se
a relação não existir e `500` em erro.

### Excluir por relação

`DELETE /collection-games/relation` recebe os IDs no corpo:

``` json
{ "collection_id": 2, "game_id": 5 }
```

A implementação converte os valores para número. Retorna `200` se a
operação retornar uma relação; em caso de falha, retorna `500`.

As rotas de consulta retornam `200` com os resultados ou `404` quando
não encontram associações. `DELETE /collection-games/:id` retorna `200`
ao excluir e `500` em caso de falha.

------------------------------------------------------------------------

## Game Genres

Gerencia a relação entre jogos e gêneros.

  Método     Rota                 Descrição
  ---------- -------------------- ------------------------------
  `POST`     `/game-genres`       Associa um gênero a um jogo.
  `GET`      `/game-genres`       Lista associações.
  `GET`      `/game-genres/:id`   Busca uma associação.
  `PUT`      `/game-genres/:id`   Atualiza uma associação.
  `DELETE`   `/game-genres/:id`   Exclui uma associação.

### Criar associação

``` json
{ "game_id": 5, "genre_id": 3 }
```

-   `201`: associação criada.
-   `400`: `game_id` ou `genre_id` ausente/falsy.
-   `500`: erro interno ou falha ao criar.

### Atualizar associação

`PUT /game-genres/:id` usa o mesmo formato de corpo, com os IDs
desejados. Retorna `200` ao atualizar, `400` se algum ID estiver
ausente, `404` se a associação não existir e `500` em erro.

As consultas retornam `200` com os dados ou `404` quando não há
resultados. A exclusão retorna `200` quando concluída ou `500` em caso
de falha.

------------------------------------------------------------------------

## Achievements

Consulta as conquistas já armazenadas no banco e o progresso de
conquistas por jogo.

  ----------------------------------------------------------------------------------
  Método                  Rota                               Descrição
  ----------------------- ---------------------------------- -----------------------
  `GET`                   `/achievements/progress`           Retorna o progresso de
                                                             conquistas de todos os
                                                             jogos.

  `GET`                   `/achievements/progress/:gameId`   Retorna o progresso de
                                                             um jogo específico.

  `GET`                   `/achievements/:gameId`            Lista as conquistas de
                                                             um jogo.
  ----------------------------------------------------------------------------------

-   `200`: dados retornados.
-   `404`: nenhuma conquista encontrada para o jogo, nas rotas
    específicas.
-   `500`: erro interno.

`gameId` é o ID interno do jogo no banco, não necessariamente o App ID
da Steam.

------------------------------------------------------------------------

## Steam API

Sincroniza dados da biblioteca Steam do usuário cadastrado e as
conquistas. Essas rotas consultam serviços externos da Steam. É
necessário cadastrar um usuário com uma Steam API Key válida em
`/users`.

  ----------------------------------------------------------------------------------------------------
  Método                  Rota                                                 Descrição
  ----------------------- ---------------------------------------------------- -----------------------
  `GET`                   `/steam-api/sync-and-update-games-from-steam`        Sincroniza a biblioteca
                                                                               completa, criando jogos
                                                                               novos e atualizando os
                                                                               existentes.

  `GET`                   `/steam-api/sync-playtime-from-steam`                Atualiza o tempo jogado
                                                                               dos jogos já
                                                                               cadastrados.

  `GET`                   `/steam-api/sync-rtime-last-played-from-steam`       Atualiza a data/hora da
                                                                               última execução dos
                                                                               jogos já cadastrados.

  `GET`                   `/steam-api/sync-achievements-from-steam`            Sincroniza conquistas
                                                                               de todos os jogos
                                                                               cadastrados que possuem
                                                                               Steam ID.

  `GET`                   `/steam-api/sync-achievements-from-steam/:steamId`   Sincroniza conquistas
                                                                               de um jogo específico
                                                                               pelo Steam App ID.
  ----------------------------------------------------------------------------------------------------

### Sincronização completa da biblioteca

`GET /steam-api/sync-and-update-games-from-steam`

A rota consulta os jogos pertencentes ao usuário na Steam e cria ou
atualiza os registros locais. Também tenta obter desenvolvedor e data de
lançamento quando esses dados não estão disponíveis no registro
existente.

Exemplo de item retornado:

``` json
{
  "steam_id": 620,
  "status": "created",
  "game": {}
}
```

`status` por item pode ser `created`, `updated` ou `error`. O objeto
`game` contém o registro retornado pelo model.

-   `200`: sincronização sem erros por item; também pode retornar `[]`
    se a biblioteca Steam estiver vazia.
-   `207`: pelo menos um jogo falhou durante a sincronização.
-   `404`: usuário não cadastrado.
-   `502`: falha ao consultar a API da Steam.
-   `500`: erro interno.

### Sincronizações leves

`GET /steam-api/sync-playtime-from-steam`

`GET /steam-api/sync-rtime-last-played-from-steam`

Essas rotas atualizam apenas o atributo correspondente dos jogos que já
existem no banco. Não criam novos jogos.

Resposta de exemplo:

``` json
{
  "updated_count": 1,
  "updated": []
}
```

-   `200`: operação concluída; se não houver jogos Steam, retorna
    `updated_count: 0` e `updated: []`.
-   `404`: usuário não cadastrado.
-   `502`: falha ao consultar a API da Steam.
-   `500`: erro interno.

### Sincronização de conquistas

`GET /steam-api/sync-achievements-from-steam` processa os jogos em
lotes. Para cada jogo, tenta armazenar o catálogo de conquistas, os
percentuais globais e o estado de desbloqueio do usuário.

Exemplo de resultado por jogo:

``` json
{ "steam_id": 620, "status": "synced" }
```

Quando há falha em um jogo, o item pode conter `status: "error"` e uma
propriedade `error`. A resposta geral é `207` se algum item falhar,
`200` se todos forem processados ou se não houver jogos rastreados,
`404` se não houver usuário e `500` em erro geral.

`GET /steam-api/sync-achievements-from-steam/:steamId` sincroniza apenas
o jogo indicado pelo Steam App ID.

-   `200`: `{ "steam_id": 620, "status": "synced" }`
-   `400`: Steam ID inválido.
-   `404`: usuário não cadastrado ou jogo não encontrado na biblioteca
    local.
-   `502`: falha ao sincronizar as conquistas desse jogo.
-   `500`: erro interno.

------------------------------------------------------------------------

## System

Rotas que consultam o estado local da instalação da Steam e permitem
solicitar o encerramento do aplicativo.

  -----------------------------------------------------------------------------
  Método                  Rota                         Descrição
  ----------------------- ---------------------------- ------------------------
  `POST`                  `/system/shutdown`           Solicita o encerramento
                                                       do sistema do launcher.

  `GET`                   `/system/installed-games`    Lista jogos instalados
                                                       detectados nas
                                                       bibliotecas Steam
                                                       locais.

  `GET`                   `/system/running-game`       Informa se um jogo Steam
                                                       está em execução.

  `GET`                   `/system/installing-game`    Lista jogos com
                                                       instalação/atualização
                                                       em andamento.

  `GET`                   `/system/required-updates`   Lista jogos instalados
                                                       que precisam de
                                                       atualização.
  -----------------------------------------------------------------------------

### `GET /system/installed-games`

Retorna uma lista de jogos detectados nos arquivos locais da Steam. Cada
item tem o formato:

``` json
{
  "appId": 620,
  "name": "Portal 2",
  "library": "C:\\Program Files (x86)\\Steam",
  "flags": 4,
  "isInstalled": true,
  "needsUpdate": false,
  "isRunning": false,
  "isInstalling": false,
  "isPaused": false,
  "isHealthy": true
}
```

A leitura procura os arquivos `appmanifest_*.acf` nas bibliotecas Steam.
O caminho pode ser definido por `STEAM_PATH`; sem essa variável, usa o
caminho padrão de cada sistema operacional. A sincronização também
atualiza o campo `installed` dos jogos existentes no banco.

-   `200`: lista retornada.
-   `500`: não foi possível ler os jogos instalados.

### `GET /system/running-game`

Resposta de exemplo quando não há jogo em execução:

``` json
{ "running": false, "game": null }
```

Quando existe jogo em execução, `game` contém o objeto do jogo
detectado.

-   `200`: verificação concluída.
-   `500`: não foi possível verificar o jogo em execução.

### `GET /system/installing-game`

Retorna uma lista de jogos que estão baixando, instalando ou aplicando
atualizações.

-   `200`: lista retornada (pode estar vazia).
-   `500`: não foi possível verificar as instalações em andamento.

### `GET /system/required-updates`

Retorna jogos instalados que possuem atualização necessária.

-   `200`: lista retornada (pode estar vazia).
-   `500`: não foi possível verificar as atualizações pendentes.

### `POST /system/shutdown`

Solicita o encerramento do navegador e do processo do frontend e, em
seguida, encerra o processo da API.

Não recebe corpo obrigatório. A rota aceita somente chamadas locais e,
quando o cabeçalho `Origin` é enviado, exige que corresponda a
`http://localhost:<FRONT_PORT>`.

-   `200`: `{ "ok": true }` antes de iniciar o encerramento.
-   `403`: origem ou endereço remoto não autorizado.

**Atenção:** esta rota encerra processos locais; não a exponha a
clientes ou redes não confiáveis.

------------------------------------------------------------------------

## Game Events (SSE)

  -----------------------------------------------------------------------
  Método                  Rota                    Descrição
  ----------------------- ----------------------- -----------------------
  `GET`                   `/game-events`          Abre uma conexão
                                                  Server-Sent Events
                                                  (SSE) para eventos de
                                                  início e encerramento
                                                  de jogos.

  -----------------------------------------------------------------------

A resposta usa `Content-Type: text/event-stream`. Ao conectar, o cliente
recebe o estado atual se já houver um jogo em execução. Depois, recebe
eventos quando um jogo inicia ou encerra.

Formato da mensagem:

``` text
data: {"type":"started","steamId":620}

data: {"type":"stopped","steamId":620}
```

-   `type`: `started` ou `stopped`.
-   `steamId`: Steam App ID do jogo.
-   A conexão permanece aberta; ao desconectar, os listeners são
    removidos.

------------------------------------------------------------------------

## Observações sobre a implementação atual

-   Os campos aceitos e as validações descritas acima refletem os
    handlers presentes nos arquivos analisados. Restrições adicionais
    podem existir no banco de dados ou nos models, que não fazem parte
    deste conjunto de arquivos.
