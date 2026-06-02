function Appointments() {
    
    const appointments = [
        {
            id: 1,
            doctor: "Dr. Sharma",
            date: "2026-05-20",
            time: "10:00 AM",
        },
        {
            id: 2,
            doctor: "Dr. Mehta",
            date: "2026-05-22",
            time: "2:00 PM",
        },
    ];
    return (
        <div>
            <h1>Appointments Page</h1>

            {appointments.map((appointment) => (
                <div key={appointment.id}>
                    <h3>{appointment.doctor}</h3>
                    <p>Date: {appointment.date}</p>
                    <p>Time: {appointment.time}</p>
                </div>
            ))}
        </div>
    );
}

export default Appointments;