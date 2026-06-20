import { useState } from "react";
import { createAppointment } from "../services/appointmentService";

function BookAppointment() {

    const [doctor, setDoctor] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [reason, setReason] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log(doctor);
        console.log(date);
        console.log(time);
        console.log(reason);

        // Handle form submission logic here
        if(!doctor || !date || !time || !reason){
            alert("Please fill in all fields");
            return;
        }

        try {
                const appointmentData = { 
                    patientId: 3,
                    doctorId: Number(doctor),
                    appointmentDate: date,
                    appointmentTime: time + ":00",
                    reason: reason
                };

                const response = await createAppointment(appointmentData);
                console.log(response);
                alert("Appointment booked successfully!");
            } catch (error) {
                console.error(error);
                alert("Failed to book appointment. Please try again.");
            }




    };

    return (
        <div>
            <h1>Book Appointment</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Doctor:</label>
                    <select
                        value={doctor}
                        onChange={(e) => setDoctor(e.target.value)}
                    >
                        <option value="">Select Doctor</option>
                        <option value="4">Dr. Sharma</option>
                        <option value="5">Dr. Mehta</option>
                        <option value="6">Dr. Gupta</option>
                        <option value="7">Dr. Singh</option>
                    </select>
                </div>
                <div>
                    <label>Date:</label>
                    <input 
                        type="date"
                        value={date}
                        min={new Date().toISOString().split("T")[0]} // Set minimum date to today
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <div>
                    <label>Time</label>
                    <input 
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    />
                </div>
                <div>
                    <label>Reason:</label>
                    <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>
                <button type="submit">Book Appointment</button>
            </form>
        </div>
    );
}
    
export default BookAppointment;