import { useState } from "react";
import { login } from "../services/authService";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function Login() {
    //This is component where state variables and submission is being handled.

    const { setUser } = useContext(AuthContext);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    

    const handleLogin = async (e) => {
        e.preventDefault();
        
        // Here you would typically send a request to your backend to authenticate the user
        if(!email || !password){
            alert("Please fill in all fields");
            return;
        }

        try{
            const loginData = { 
                email, 
                password 
            };

            const response = await login(loginData);

            setUser(response);
            
            console.log(response);
            alert("Login successful");

        }catch (error){
            console.error(error);

            if(error.response){
                alert(error.response.data.message || "Login failed");
            }else{
                alert("Network Error: Please check your connection");
            }
            
        }

    };
    
    return (
        <div>
            <h1>Login</h1>

            <form onSubmit={handleLogin}>
                <div>
                    <label>Email:</label>
                    <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                    <label>Password:</label>
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
}

export default Login;