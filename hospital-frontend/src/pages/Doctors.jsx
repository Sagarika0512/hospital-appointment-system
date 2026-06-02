import { useEffect, useState } from "react";
import { getDoctors } from "../services/doctorService";

function Doctors() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
    async function loadDoctors() {
        try {
            const data = await getDoctors();
            setDoctors(data);
        } catch (error) {
            console.error(error);
            setError("Failed to load doctors");
        } finally {
            setLoading(false);
        }
    }

    loadDoctors();
}, []);
    

    if(loading) {
        return <h2>Loading...</h2>;
    }

    if(error) {
        return <h2>{error}</h2>;
    }

    if(doctors.length === 0) {
        return <h2>No doctors available.</h2>;
    }


    return (
        <div>
            <h1>Doctors Page</h1>

            {doctors.map((doctor) => (
                <div key={doctor.id}>
                    <h3>{doctor.name}</h3>
                    <p>{doctor.specialization}</p>
                </div>
            ))}
        </div>
    );
} 

export default Doctors;