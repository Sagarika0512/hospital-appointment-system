import { useState } from "react";
import { register } from "../services/authService";

function Register() {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();

        //Adding Validation
        if(!name || !email || !password){
            alert("Please fill in all fields");
            return;
        }

        try{
            const userData = { 
                name, 
                email, 
                password, 
                role: "PATIENT"
            };

            const response = await register(userData);

            console.log(response);
            alert("Registration successful");

        }catch (error){
            console.error(error);

            if(error.response){
                alert(error.response.data.message || "Registration failed");
            }else{
                alert("Network Error: Please check your connection");
            }            
        }
    };

    return (
        <div>
            <h1>Register</h1>

            <form onSubmit={handleRegister}>
                <div>
                    <label>Name:</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div>
                    <label>Email:</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button type="submit">Register</button>
            </form>
        </div>
    );
}

export default Register;