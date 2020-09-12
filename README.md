# command-line

## Configurações iniciais

Instalar dependências

> npm install

Criar arquivo `.env` com as variaveis de ambiente na raiz do projeto.

> touch .env

```
URL_GITLAB=
TOKEN_GITLAB=

URL_JENKINS=
TOKEN_JENKINS=
USER_JENKINS=

TOKEN_SLACK=
GROUP_SLACK=

K8S_USER_UN=
K8S_KEY_UN=

```

Para gerar o token para o jenkins e gitlab, segue os passos abaixo.

> http://URL_JENKINS/user/ilegra.dariano/configure

Para gerar o token para o gitlab:

> http://URL_GITLAB/profile/personal_access_tokens

Para gerar o token do slack:

> https://api.slack.com/custom-integrations/legacy-tokens
