import { useEffect, useState } from "react";
import { getAppointments } from "../services/appointmentService";

function Appointments() {
    
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        async function loadAppointments() {
            try{
                const data = await getAppointments();
                setAppointments(data);
            }catch(error){
                console.error(error);
                setError("Failed to load appointments. Please try again later.");
            }finally{
                setLoading(false);
            }
        }

        loadAppointments();

    }, []);


    if(loading){
        return <h2>Loading...</h2>;
    }

    if(error){
        return <h2>{error}</h2>;
    }






    return (
        <div>
            <h1>Appointments Page</h1>

            {appointments.map((appointment) => (
                <div key={appointment.id}>
                    <h3>{appointment.doctorName}</h3>
                    
                    <p>Patient: {appointment.patientName}</p>

                    <p>Date: {appointment.appointmentDate}</p>

                    <p>Time: {appointment.appointmentTime}</p>

                    <p>Reason: {appointment.reason}</p>

                    <p>Status: {appointment.status}</p>
                </div>
            ))}
        </div>
    );
}

export default Appointments;