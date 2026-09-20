# Não seguidores

Extensão para o Google Chrome que mostra quem você segue no Instagram e não segue você de volta. Visual preto e branco, abre em uma aba própria e roda inteira no seu navegador.

## Recursos

- Lista de quem **não segue você de volta**, com foto, nome de usuário e nome completo
- Aba **Você não segue**, com quem segue você e você não segue de volta
- Aba **Ignorados**, para tirar da lista principal perfis que você quer manter (amigos, marcas, páginas)
- Busca por usuário ou nome
- Botões para **copiar a lista** e **baixar em CSV**
- O último resultado fica salvo, então dá para abrir a extensão sem escanear de novo
- Barra de progresso durante o escaneamento

## Instalação

A extensão ainda não está na Chrome Web Store, então a instalação é manual.

1. Baixe este repositório (**Code** e depois **Download ZIP**) e extraia, ou clone com `git clone`.
2. Abra `chrome://extensions` no Chrome.
3. Ative o **Modo do desenvolvedor**, no canto superior direito.
4. Clique em **Carregar sem compactação** e selecione a pasta do projeto, a que contém o arquivo `manifest.json`.

Funciona também em navegadores baseados no Chromium, como Edge e Brave.

## Como usar

1. Abra o [instagram.com](https://www.instagram.com) e entre na sua conta.
2. Clique no ícone da extensão. Uma aba nova será aberta.
3. Clique em **Escanear agora** e espere o progresso terminar.
4. Navegue pelas abas, use a busca e clique no nome de alguém para abrir o perfil.

Deixe a aba do Instagram aberta durante o escaneamento, porque é ela que faz a leitura. Se você fechar ou recarregar essa aba no meio, a extensão avisa e basta escanear de novo.

## Como funciona

A extensão injeta o arquivo `content.js` na aba do Instagram. Ele usa a sua sessão já aberta para consultar os mesmos endereços internos que o site do Instagram usa para carregar as listas de seguindo e seguidores, em páginas de 100 perfis, com pausas aleatórias entre elas para não sobrecarregar o serviço. Depois compara as duas listas pelo ID de cada conta.

A página `app.html` encontra a aba do Instagram, acompanha o progresso e mostra o resultado.

## Privacidade

- Nenhuma senha é pedida ou lida
- Nenhum dado é enviado para servidores de terceiros ou para o autor
- O resultado e a lista de ignorados ficam salvos apenas no armazenamento local do seu navegador (`chrome.storage.local`)

### Permissões

| Permissão | Para que serve |
| --- | --- |
| `scripting` | Injetar o script de leitura na aba do Instagram |
| `storage` | Guardar o último resultado e os perfis ignorados |
| `https://www.instagram.com/*` | Acessar a aba e as listas do Instagram |

## Estrutura do projeto

```
nao-seguidores/
├── manifest.json     Configuração da extensão (Manifest V3)
├── background.js     Abre a página da extensão em uma aba ao clicar no ícone
├── content.js        Roda na aba do Instagram e lê as listas
├── app.html          Estrutura da página da extensão
├── app.css           Estilo preto e branco
├── app.js            Conexão com a aba, listas, busca, ignorar, copiar e CSV
└── icons/            Ícones da extensão
```

## Limitações e avisos

- O Instagram não oferece uma API pública para isso. A extensão usa endereços internos do site, que podem mudar sem aviso e quebrar o funcionamento.
- Automatizar consultas pode ir contra os termos de uso do Instagram e, em casos de uso excessivo, causar bloqueios temporários. Evite escanear várias vezes seguidas.
- Se aparecer a mensagem de limite de requisições, espere alguns minutos antes de tentar de novo.
- Por segurança, a extensão **não** deixa de seguir ninguém automaticamente. Cada perfil tem um link para você decidir manualmente.
- Projeto independente, sem qualquer ligação com o Instagram ou a Meta.

## Contribuindo

Sugestões e correções são bem-vindas. Abra uma *issue* descrevendo o problema ou envie um *pull request*.

## Licença

Defina a licença do projeto antes de publicar. A MIT é uma escolha comum para projetos abertos como este.
