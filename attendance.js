// ⚠️ REPLACE THIS with your actual Render URL (no trailing slash)
const API_BASE = 'https://attendease-backend-viyw.onrender.com';

let allStudents = [];

// Set today's date on load
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('datePicker').value = today;
    loadStudents();
});

// 1. Fetch all students from MongoDB
async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE}/api/students`);
        allStudents = await response.json();
        loadAttendance(); // Load their attendance status after getting students
    } catch (error) {
        console.error("Error loading students:", error);
        alert("Failed to connect to backend. Render may be waking up. Please wait 30 seconds and refresh.");
    }
}

// 2. Add a new student to the database
async function addStudent() {
    const name = document.getElementById('studentName').value;
    const rollNo = document.getElementById('studentRoll').value;

    if (!name || !rollNo) {
        alert("Please enter both Name and Roll Number.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, rollNo })
        });

        if (response.ok) {
            document.getElementById('studentName').value = '';
            document.getElementById('studentRoll').value = '';
            loadStudents(); // Refresh list
        } else {
            const err = await response.json();
            alert("Error adding student: " + err.error);
        }
    } catch (error) {
        console.error("Error adding student:", error);
    }
}

// 3. Load attendance for the selected date
async function loadAttendance() {
    const date = document.getElementById('datePicker').value;
    if (!date) return;

    try {
        const response = await fetch(`${API_BASE}/api/attendance/${date}`);
        const records = await response.json();
        renderTable(allStudents, records, date);
    } catch (error) {
        console.error("Error loading attendance:", error);
    }
}

// 4. Render the table UI
function renderTable(students, records, date) {
    const tbody = document.getElementById('studentList');
    tbody.innerHTML = '';

    students.forEach(student => {
        // Find if this student has an attendance record for this date
        const record = records.find(r => r.studentId && r.studentId._id === student._id);
        const status = record ? record.status : 'Not Marked';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.rollNo}</td>
            <td>
                <span class="status ${status.toLowerCase().replace(' ', '-')}">
                    ${status.toUpperCase()}
                </span>
            </td>
            <td>
                <button onclick="markAttendance('${student._id}', '${date}', 'present')" class="btn-present">Present</button>
                <button onclick="markAttendance('${student._id}', '${date}', 'absent')" class="btn-absent">Absent</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 5. Mark attendance
async function markAttendance(studentId, date, status) {
    try {
        await fetch(`${API_BASE}/api/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, date, status })
        });
        loadAttendance(); // Refresh the table to show the new status
    } catch (error) {
        console.error("Error marking attendance:", error);
    }
}