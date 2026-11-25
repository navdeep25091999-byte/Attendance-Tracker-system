const API_BASE = 'https://attendease-backend-viyw.onrender.com';
let allStudents = [];
let currentDate = new Date().toISOString().split('T')[0];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('attendanceDate').value = currentDate;
    
    const user = localStorage.getItem('loggedInUser');
    if (user) {
        document.getElementById('userName').innerText = user;
    } else {
        document.getElementById('userName').innerText = 'Guest';
    }

    loadStudents();
});

// 1. Fetch students and attendance from MongoDB
async function loadStudents() {
    try {
        const studentRes = await fetch(`${API_BASE}/api/students`);
        allStudents = await studentRes.json();

        const attRes = await fetch(`${API_BASE}/api/attendance/${currentDate}`);
        const attendanceRecords = await attRes.json();

        allStudents.forEach(student => {
            const record = attendanceRecords.find(r => r.studentId && r.studentId._id === student._id);
            student.status = record ? record.status : 'notMarked';
        });

        showStudents(); 
    } catch (error) {
        console.error("Error loading data:", error);
        document.getElementById('studentList').innerHTML = `<p style="color:red; text-align:center;">Failed to load data. Server might be waking up. Refresh in 30 seconds.</p>`;
    }
}

// 2. Add a new student
async function addStudent() {
    const nameInput = document.getElementById('studentName');
    const rollInput = document.getElementById('studentRoll');
    
    const name = nameInput.value.trim();
    const roll = rollInput.value.trim();

    if (!name || !roll) {
        alert("Please enter both name and roll number.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, rollNo: roll })
        });

        if (response.ok) {
            nameInput.value = '';
            rollInput.value = '';
            loadStudents(); 
        } else {
            const err = await response.json();
            alert("Error: " + err.error);
        }
    } catch (error) {
        console.error("Error adding student:", error);
    }
}

// 3. Mark Attendance
async function markAttendance(studentId, status) {
    try {
        await fetch(`${API_BASE}/api/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, date: currentDate, status })
        });
        loadStudents(); 
    } catch (error) {
        console.error("Error marking attendance:", error);
    }
}

// 4. Change Date
function changeDate() {
    currentDate = document.getElementById('attendanceDate').value;
    loadStudents();
}

// 5. Render UI (Matches your CSS perfectly)
function showStudents() {
    const listDiv = document.getElementById('studentList');
    const statusFilter = document.getElementById('statusFilter').value;
    const searchQuery = document.getElementById('search') ? document.getElementById('search').value.toLowerCase() : '';

    listDiv.innerHTML = ''; 

    let presentCount = 0;
    let absentCount = 0;
    let notMarkedCount = 0;

    const filtered = allStudents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery) || student.rollNo.toLowerCase().includes(searchQuery);
        const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        listDiv.innerHTML = '<p style="text-align:center; color:#64748B;">No students found. Add one above!</p>';
    }

    filtered.forEach(student => {
        if (student.status === 'present') presentCount++;
        else if (student.status === 'absent') absentCount++;
        else notMarkedCount++;

        // Generating HTML that matches your CSS (.student-card, h2, h4, etc.)
        const card = document.createElement('div');
        card.className = 'student-card';
        card.innerHTML = `
            <h2>${student.name}</h2>
            <h4>Roll No: ${student.rollNo}</h4>
            <p>Status on ${currentDate}: <strong>${student.status.toUpperCase()}</strong></p>
            <div class="actions">
                <button onclick="markAttendance('${student._id}', 'present')">Present</button>
                <button onclick="markAttendance('${student._id}', 'absent')">Absent</button>
            </div>
        `;
        listDiv.appendChild(card);
    });

    // Update the count box
    const countDiv = document.getElementById('count');
    if (countDiv) {
        countDiv.className = 'count-style'; // Adds your CSS class
        countDiv.innerHTML = `
            <h3>Total Stats</h3>
            <p>🟢 Present: ${presentCount}</p>
            <p>🔴 Absent: ${absentCount}</p>
            <p>⚪ Not Marked: ${notMarkedCount}</p>
        `;
    }
}

// 6. Search Function
function search() {
    showStudents();
}

// 7. Reset All (Note: Database deletion is disabled for safety)
function resetAll() {
    alert("Reset All is disabled for the cloud database to prevent accidental data loss. You can delete individual students in MongoDB.");
}