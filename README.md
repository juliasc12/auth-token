##
 <div align="center">
 
 <b>Aplicativo desenvolvido para entender na prática o fluxo de autenticação e autorização com token JWT.</b>
 <img width="1000" src="https://uploaddeimagens.com.br/images/004/175/439/original/fluxo-removebg-preview_%282%29.png?1669251653">
 
</div>

## Introdução
- Backend
  - Caso as credenciais de login estiverem corretas, será gerado um token JWT que contém um tempo de expiração definido 
(variável <b>stateless</b>: não é armazenada no banco de dados, sua validação ocorre pelo <b>secret</b>)
e o Refresh Token (variável <b>statefull</b> que será armazenada no banco de dados, é importante para revogar acesso à aplicação) responsável por monitorar a validade do jwt. 
Caso este esteja expirado, o refresh token se torna válido e será gerado um novo jwt e um novo refresh token para revalidação em loop.

- Frontend
  - Responsável por detectar se o jwt foi expirado e então, fazer a requisição pro backend com o refresh token. 
  - Mas como reconhecer que o jwt foi expirado? E se estiver expirado, como lidar com requisições simultâneas enquanto executa a revalidação do token?

## Tecnologias Utilizadas no Desenvolvimento
- <b>Backend</b>
  - Express, Cors, JsonWebToken, JwtDecode, Uuid (RefreshToken) e Axios
- <b>Frontend</b>
  - React, Typescript, Next, JwtDecode e Nookies.

## Instalação das dependências e execução. 
 Importante sempre deixar ligado o servidor pro funcionamento da autenticação web.
 
  - clonar repositório
    > git clone https://github.com/juliasc12/auth-token.git
    
  - cd server | cd web
    > yarn install <br>
    > yarn run dev
    
## Sobre a aplicação...
- Para manter as informações do token e refreshToken do usuário mesmo se houver atualização da página será necessário utilizar os <b> cookies </b>, os dados podem ser
acessados tanto pelo browser quanto pelo servidor. Neste caso, foi utilizada a biblioteca Nookies.
  
- Para manter os dados do usuário como email, permissões e roles foi implementado que ao usuário logar na app pela <b> primeira vez </b>,
teremos um UseEffect acessando o token nos cookies e fazendo a requisição pra api (no header há a autorização com o token) que retornará os dados do usuário e então setUser.

- Para uma melhor navegação na app, é importante antes de encaminhar o usuário em tal rota ou requisição sempre atualizar a informação do header de autorização (na api). 
Uma vez que que o token só será criado depois do login e algumas rotas são carregas anteriores a este evento.
  - api.default.headers['Authorization'] = ´Bearer ${token}´
  
- Refresh Token -> toda vez que a app identificar que o jwt está expirado, gerar novos tokens através de chamadas ao backend.
  - api.interceptors: interceptar requisições e respostas. Neste caso, foi interceptado a resposta recebida do backend sobre o token.
    - <b>token válido:</b> retorna resposta
    - <b>token inválido:</b>  se code http for 401 -> se o token está expirado -> refresh token. <br> (caso seja apenas erro 401 e token válido, o usuário é deslogado por erro de autenticação)<br>
    - [Lógica](/web/services/api.ts): o interceptor ao identificar o token inválido, deve pauser todas as requisições que estão sendo feitas e as que serão executadas até que o token seja atualizado e validado.
    A partir disso, será reexecutadas todas as requisições que estavam na fila de espera com o novo token. 
    
- Algumas validações de autenticação do usuário para rotas, poderia ser facilmente validado pelo frontend com o useEffect. Porém, pela propriedade dos cookies de permitirem
serem acessados pelo lado do servidor também, é implementado o <b>método do Next SSR</b> para lidar com cookies pelo backend.
  - Propriedade redirect: redireciona o usuário caso a condição não seja satisfeita
  - Parâmetro ctx -> ctx.req.cookies: acesso a todos os cookies armazenados na página
  - Se existe um refresh token o usuário é direcionado a pagina inicial.
  
 - Para aplicações futuras em que exista diversas telas que seja necessária que o usuário esteja logado para acessar sem a necessidade de
 repetir o código do método SSR em todas essas telas foi aplicado o conceito de <b> Higher Order Function </b> (uma função que retorna uma função
 ou recebe por parâmetro a função e a executa), ou seja, foi criado um arquivo com uma [função](/web/web/utils/withSSRAuth.ts) que englobará o metodo SSR e a executa, e em tela, ela é chamada enviando os parâmetros pra SSR. 
 
 - <b>Controle de permissões</b> (propriedade do User)
    - por hooks: 
      - [useCan](web/hooks/useCan.ts) -> retorna se o usuário tem permissão ou cargo pra fazer tal ação
    - por components: 
      - [Can](web/components/Can.ts) -> confere pelo hook se o usuário tem permissão ou cargo pra ver tal componente
    - validar permissões pelo servidor: 
      - o servidor só tem acesso ao token ou seja, dados como permissões do usuário só se é acessível quando o token é desincriptado 
      (lembrando que encriptado ≠ encriptografado) e para isso foi utilizado o Jwt-Decode. É importante lembrar que na app, a atualização do token é realizada a cada 15min, o que nos traz a vantagem de sempre ter dados bem atualizados do usuário.
      - o servidor não consegue utilizar hooks, neste caso, a lógica foi desacoplada do hook e implementada em uma função em utils (abstração) que pode ser utilizada no hook e no servidor.
      
- <b> Broadcast de usuário: </b> ação de deslogar o usuário de todas as guias abertas, caso ele tenha solicitado o logout.
  - [API Broadcast Channel](https://developer.mozilla.org/pt-BR/docs/Web/API/BroadcastChannel);

    
