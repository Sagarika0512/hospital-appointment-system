import { useState } from "react";

function BookAppointment() {

    const [doctor, setDoctor] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log(doctor);
        console.log(date);
        console.log(time);

        // Handle form submission logic here
        if(!doctor || !date || !time){
            alert("Please fill in all fields");
            return;
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
                        <option value="Dr. Sharma">Dr. Sharma</option>
                        <option value="Dr. Mehta">Dr. Mehta</option>
                    </select>
                </div>
                <div>
                    <label>Date:</label>
                    <input 
                        type="date"
                        value={date}
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

                <button type="submit">Book Appointment</button>
            </form>
        </div>
    );
}
    
export default BookAppointment;