// Your live Render backend URL
const API_BASE = 'https://attendease-backend-viyw.onrender.com';
let allStudents = [];
let currentDate = new Date().toISOString().split('T')[0];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Set the date picker to today
    document.getElementById('attendanceDate').value = currentDate;
    
    // Show logged-in user
    const user = localStorage.getItem('loggedInUser');
    if (document.getElementById('userName')) {
        document.getElementById('userName').innerText = user ? user : 'Guest';
    }

    loadStudents();
});

// 1. Fetch students and attendance from MongoDB
async function loadStudents() {
    try {
        // Fetch students
        const studentRes = await fetch(`${API_BASE}/api/students`);
        allStudents = await studentRes.json();

        // Fetch attendance for the selected date
        const attRes = await fetch(`${API_BASE}/api/attendance/${currentDate}`);
        const attendanceRecords = await attRes.json();

        // Merge the attendance status into the students array
        allStudents.forEach(student => {
            const record = attendanceRecords.find(r => r.studentId && r.studentId._id === student._id);
            student.status = record ? record.status : 'notMarked';
        });

        showStudents(); // Render the UI
    } catch (error) {
        console.error("Error loading data:", error);
        document.getElementById('studentList').innerHTML = `<p style="color:red; text-align:center;">Failed to load data. Server might be waking up. Refresh in 30 seconds.</p>`;
    }
}

// 2. Add a new student (Using your new IDs: namee and rollno)
async function addStudent() {
    const nameInput = document.getElementById('namee');
    const rollInput = document.getElementById('rollno');
    
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
            loadStudents(); // Refresh the list
        } else {
            const err = await response.json();
            alert("Error: " + err.error);
        }
    } catch (error) {
        console.error("Error adding student:", error);
    }
}

// 3. Mark Attendance (Present/Absent)
async function markAttendance(studentId, status) {
    try {
        await fetch(`${API_BASE}/api/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, date: currentDate, status })
        });
        loadStudents(); // Refresh to show the new status
    } catch (error) {
        console.error("Error marking attendance:", error);
    }
}

// 4. Change Date
function changeDate() {
    currentDate = document.getElementById('attendanceDate').value;
    loadStudents();
}

// 5. Render the UI
function showStudents() {
    const listDiv = document.getElementById('studentList');
    const statusFilter = document.getElementById('statusFilter').value;
    const searchQuery = document.getElementById('search') ? document.getElementById('search').value.toLowerCase() : '';

    listDiv.innerHTML = ''; 

    let presentCount = 0;
    let absentCount = 0;
    let notMarkedCount = 0;

    // Filter by search query and dropdown status
    const filtered = allStudents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchQuery) || student.rollNo.toLowerCase().includes(searchQuery);
        const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        listDiv.innerHTML = '<p style="text-align:center; color:#64748B;">No students found.</p>';
    }

    filtered.forEach(student => {
        if (student.status === 'present') presentCount++;
        else if (student.status === 'absent') absentCount++;
        else notMarkedCount++;

        // Create the student card using your exact CSS classes
        const card = document.createElement('div');
        card.className = 'student-card';
        card.innerHTML = `
            <h2>${student.name}</h2>
            <h4>Roll No: ${student.rollNo}</h4>
            <p>Status: <strong>${student.status.toUpperCase()}</strong></p>
            <button onclick="markAttendance('${student._id}', 'present')" style="background-color: #10B981; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; margin-right: 10px;">Present</button>
            <button onclick="markAttendance('${student._id}', 'absent')" style="background-color: #EF4444; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer;">Absent</button>
        `;
        listDiv.appendChild(card);
    });

    // Update the count box with your exact CSS class
    const countDiv = document.getElementById('count');
    if (countDiv) {
        countDiv.className = 'count-style'; 
        countDiv.innerHTML = `
            <h3>Total Stats</h3>
            <p>🟢 Present: <strong>${presentCount}</strong></p>
            <p>🔴 Absent: <strong>${absentCount}</strong></p>
            <p>⚪ Not Marked: <strong>${notMarkedCount}</strong></p>
        `;
    }
}

// 6. Search Function
function search() {
    showStudents();
}

// 7. Reset All (Disabled for Cloud Database)
function resetAll() {
    alert("Reset All is disabled for the cloud database to prevent accidental data loss. You can delete individual students in MongoDB.");
}