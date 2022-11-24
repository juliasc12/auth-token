//qdo cria-se uma classe de erro é melhor p identificar qual o erro, não fica tão genérico

export class AuthTokenError extends Error{
    constructor(){
        super('Error with authentication token')
    }
}