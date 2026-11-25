
const API_BASE = 'https://attendease-backend-viyw.onrender.com';

let allStudents = [];

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const datePicker = document.getElementById('datePicker');
    if (datePicker) datePicker.value = today;
    loadStudents();
});

// 1. Fetch students from MongoDB
async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE}/api/students`);
        allStudents = await response.json();
        
        // If you have a function to render the table, call it here
        if (typeof renderTable === 'function') {
            renderTable(allStudents);
        } else {
            // Fallback if no render function exists (for testing)
            console.log("Students loaded from DB:", allStudents);
        }
    } catch (error) {
        console.error("Error loading students:", error);
        alert("Failed to connect to backend. Render may be waking up. Please wait 30 seconds and refresh.");
    }
}

// 2. Add a new student
async function addStudent() {
    // Note: Check your HTML to make sure these IDs match your input fields
    const nameInput = document.getElementById('studentName') || document.getElementById('name');
    const rollInput = document.getElementById('studentRoll') || document.getElementById('rollNo');
    
    const name = nameInput ? nameInput.value : '';
    const rollNo = rollInput ? rollInput.value : '';

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
            if (nameInput) nameInput.value = '';
            if (rollInput) rollInput.value = '';
            loadStudents(); // Refresh list
        } else {
            const err = await response.json();
            alert("Error adding student: " + err.error);
        }
    } catch (error) {
        console.error("Error adding student:", error);
    }
}
