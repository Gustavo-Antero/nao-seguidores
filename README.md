# Não seguidores

Extensão para o Google Chrome que mostra quem você segue no Instagram e não segue você de volta. Tem visual preto e branco, abre em uma aba própria e roda inteira no seu navegador, sem enviar nada para servidores externos.

## O que ela faz

- Lista quem **não segue você de volta**, com foto, nome de usuário e nome completo
- Mostra em outra aba quem você **não segue de volta**
- Permite **ignorar** perfis que você quer manter (amigos, marcas, páginas) e restaurar depois
- Busca por usuário ou nome
- **Copia a lista** ou **baixa em CSV**
- Guarda o último resultado, então dá para abrir a extensão sem escanear de novo
- Mostra o progresso durante o escaneamento

## Instalação

A extensão ainda não está na Chrome Web Store, então a instalação é manual.

1. Baixe o projeto:
   ```bash
   git clone https://github.com/Gustavo-Antero/nao-seguidores.git
   ```
   Ou clique em **Code** e depois em **Download ZIP**, e extraia o arquivo.
2. Abra `chrome://extensions` no Chrome.
3. Ative o **Modo do desenvolvedor**, no canto superior direito.
4. Clique em **Carregar sem compactação** e selecione a pasta do projeto, a que contém o arquivo `manifest.json`.

Também funciona em navegadores baseados no Chromium, como Edge e Brave.

Para atualizar depois de baixar uma versão nova, volte em `chrome://extensions` e clique no botão de recarregar da extensão.

## Como usar

1. Abra o [instagram.com](https://www.instagram.com) e entre na sua conta.
2. Clique no ícone da extensão. Uma aba nova será aberta.
3. Clique em **Escanear agora** e espere o progresso terminar.
4. Navegue pelas abas, use a busca e clique no nome de alguém para abrir o perfil.

Deixe a aba do Instagram aberta durante o escaneamento, porque é ela que faz a leitura. Se você fechar ou recarregar essa aba no meio, a extensão avisa e basta escanear de novo.

## Como funciona

O arquivo `content.js` é injetado na aba do Instagram e usa a sua sessão já aberta para consultar os mesmos endereços internos que o site usa para carregar as listas de quem você segue e de quem segue você. As consultas vêm em páginas de 100 perfis, com pausas aleatórias entre elas para não sobrecarregar o serviço. Depois, as duas listas são comparadas pelo ID de cada conta.

A página `app.html` encontra a aba do Instagram, acompanha o progresso e mostra o resultado.

## Privacidade

- Nenhuma senha é pedida ou lida
- Nenhum dado é enviado para servidores de terceiros nem para o autor
- O resultado e a lista de ignorados ficam apenas no armazenamento local do seu navegador (`chrome.storage.local`)

### Permissões

| Permissão | Para que serve |
| --- | --- |
| `scripting` | Injetar o script de leitura na aba do Instagram |
| `storage` | Guardar o último resultado e os perfis ignorados |
| `https://www.instagram.com/*` | Acessar a aba e as listas do Instagram |

## Solução de problemas

| Mensagem ou situação | O que fazer |
| --- | --- |
| A página pede para abrir o Instagram | Abra o instagram.com em outra aba e entre na sua conta. A extensão detecta a aba sozinha. |
| O Instagram limitou as requisições | Espere alguns minutos antes de tentar de novo e evite escanear várias vezes seguidas. |
| Sessão inválida ou não foi possível acessar a aba | Recarregue a aba do Instagram (`F5`), confirme que está logado e abra a extensão de novo. |
| A aba do Instagram foi fechada ou recarregada | Abra o Instagram de novo e clique em **Escanear de novo**. |
| Uma foto de perfil não aparece | Acontece quando o Instagram bloqueia a imagem. A extensão mostra a inicial do usuário no lugar. |
| O escaneamento demora | É proposital. As pausas entre as páginas evitam bloqueios, então contas com muitos seguidores levam mais tempo. |

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
- Automatizar consultas pode ir contra os termos de uso do Instagram e, em caso de uso excessivo, causar bloqueios temporários.
- Por segurança, a extensão **não** deixa de seguir ninguém automaticamente. Cada perfil tem um link para você decidir manualmente.
- Projeto independente, sem qualquer ligação com o Instagram ou a Meta.

## Ideias para o futuro

- Histórico de escaneamentos para mostrar quem deixou de seguir você desde a última vez
- Exportação da lista em outros formatos

## Contribuindo

Sugestões e correções são bem-vindas. Abra uma *issue* descrevendo o problema ou envie um *pull request*.

## Autor

Feito por Gustavo ([@Gustavo-Antero](https://github.com/Gustavo-Antero)).

## Licença

Distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
