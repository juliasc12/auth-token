import Router from "next/router";
import { createContext, ReactNode, useEffect, useState } from "react";
import { setupAPIClient } from "../services/api";
import { destroyCookie, parseCookies, setCookie } from 'nookies'
import { api } from "../services/apiClient";


type User = {
    email: string;
    permissions: string[];
    roles: string[];
}

type SignInCredentials = {
    email: string,
    password: string
}

type AuthContextData = {
    signIn(credentials: SignInCredentials): Promise<void>;
    signOut(): void;
    isAuthenticated: boolean;
    user: User;
}

type AuthProviderProps = {
    children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

let authChannel: BroadcastChannel;

export function signOut(){
    destroyCookie(undefined, 'nextauth.token');
    destroyCookie(undefined, 'nextauth.refreshtoken');
    //authChannel.postMessage('signOut');
    Router.push('/');
}

export function AuthProvider({ children }: AuthProviderProps){
    const [user, setUser] = useState<User>();
    const isAuthenticated = !!user;

    useEffect(() => {
        authChannel = new BroadcastChannel('auth')
    
        authChannel.onmessage = (message) => {
          switch (message.data) {
            case 'signOut':
              signOut();
              break;
            default:
              break;
          }
        }
    }, []);

    useEffect(() => {
        const {'nextauth.token': token } = parseCookies()
        
        if(token){
            api.get('/me').then(response => {
                const { email, permissions, roles } = response.data;
                setUser({ email,  permissions, roles });
            })
            .catch(error => {
                signOut();
            })
        }
    }, []) //array de dependencias vazio p ser executado apenas uma vez

    async function signIn({email, password}: SignInCredentials) {
        try{
            const response = await api.post('sessions', {
                email,
                password
            })    
            
            const {token, refreshToken, permissions, roles} = response.data;
            
            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, //tempo que ficará armazenado (o frontend - browser - nao tem a responsabilidade de retirar o token do cookie, isso é papel do backend)
                path: '/'  //quais caminhos da app tem acessa ao cookie, no caso qqr endereço tem acesso.
            });

            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
            });

            setUser({ email, permissions, roles });

            api.defaults.headers['Authorization'] = `Bearer ${token}`
            
            Router.push('/dashboard');

        }catch(err){
            console.log(err);
        }
        
    }

    return(
        <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user}}>
            {children}
        </AuthContext.Provider>
    )
}