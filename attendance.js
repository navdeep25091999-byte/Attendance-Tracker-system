// ==========================================================
// ATTENDANCE.JS — Date-wise attendance logic
// ==========================================================

/* ========== AUTH GUARD ========== */
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

if (!currentUser) {
    alert("Please login first!");
    window.location.href = "login.html";
}

/* ========== USER DISPLAY + LOGOUT ========== */
document.getElementById("userName").textContent = currentUser.name;

document.getElementById("logoutBtn").addEventListener("click", function (e) {
    e.preventDefault();
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
});

/* ========== STATE ========== */
let selectedDate = todayString();
let students = [];

/* ========== HELPERS ========== */
function todayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

function getStorageKey() {
    return "students_" + currentUser.email;
}

function loadStudents() {
    const saved = localStorage.getItem(getStorageKey());
    return saved ? JSON.parse(saved) : [];
}

function saveStudents() {
    localStorage.setItem(getStorageKey(), JSON.stringify(students));
}

function migrateStudent(s) {
    if (!s.attendance) {
        s.attendance = {};
        if (s.status && s.status !== "Not Marked") {
            s.attendance[todayString()] = s.status;
        }
        delete s.status;
    }
    return s;
}

/* ========== INIT ========== */
students = loadStudents().map(migrateStudent);
saveStudents();
document.getElementById("attendanceDate").value = selectedDate;

/* ========== DATE CHANGE ========== */
function changeDate() {
    selectedDate = document.getElementById("attendanceDate").value;
    showStudents();
    showCount();
}

/* ========== ADD STUDENT ========== */
function addStudent() {
    const name = document.getElementById("namee").value.trim();
    const roll = document.getElementById("rollno").value.trim();

    if (name === "" || roll === "") {
        showToast("Please enter both name and roll number.", "error");
        return;
    }

    for (let i = 0; i < students.length; i++) {
        if (students[i].rollno === roll) {
            showToast("This roll number already exists!", "error");
            return;
        }
    }

    students.push({
        namee: name,
        rollno: roll,
        attendance: {}
    });

    document.getElementById("namee").value = "";
    document.getElementById("rollno").value = "";

    saveStudents();
    showStudents();
    showToast("Student added successfully!", "success");
}

/* ========== SHOW STUDENTS ========== */
function showStudents() {
    const list = document.getElementById("studentList");
    const filter = document.getElementById("statusFilter").value;

    let html = "<h2>List of Students</h2>";
    let shownCount = 0;

    for (let i = 0; i < students.length; i++) {
        const s = students[i];
        const status = s.attendance[selectedDate] || "Not Marked";

        let matches = false;

        if (filter === "all") matches = true;
        else if (filter === "present" && status === "Present") matches = true;
        else if (filter === "absent" && status === "Absent") matches = true;
        else if (filter === "notMarked" && status === "Not Marked") matches = true;

        if (matches) {
            const lock = status !== "Not Marked";
            const lockStyle = lock ? "opacity:0.55;cursor:not-allowed;" : "";
            const totalMarked = Object.keys(s.attendance).length;
            const presentDays = Object.values(s.attendance).filter(function (v) {
                return v === "Present";
            }).length;
            const absentDays = Object.values(s.attendance).filter(function (v) {
                return v === "Absent";
            }).length;

            html += "<div class='student-card'>";
            html += "<h2>Name: " + s.namee + "</h2>";
            html += "<h4>Roll No: " + s.rollno + "</h4>";
            html += "<p><strong>Status on " + selectedDate + ":</strong> " + status + "</p>";
            html += "<p style='font-size:12px;color:#64748B;'>📊 History: " +
                    totalMarked + " days marked · " +
                    presentDays + " P · " +
                    absentDays + " A</p>";
            html += "<button style='background-color:darkgreen;" + lockStyle + "' " +
                    "onclick='markPresent(" + i + ")' " +
                    (lock ? "disabled" : "") + ">Present</button>";
            html += "<button style='background-color:maroon;" + lockStyle + "' " +
                    "onclick='markAbsent(" + i + ")' " +
                    (lock ? "disabled" : "") + ">Absent</button>";
            html += "<button style='background-color:grey' onclick='editStudent(" + i + ")'>Edit</button>";
            html += "<button style='background-color:#334155' onclick='deleteStudent(" + i + ")'>Delete</button>";
            html += "<button style='background-color:#7c3aed' onclick='viewHistory(" + i + ")'>History</button>";
            html += "</div>";

            shownCount++;
        }
    }

    if (students.length === 0) {
        html += "<p>No students added yet.</p>";
    } else if (shownCount === 0) {
        html += "<p>No students match this filter for " + selectedDate + ".</p>";
    }

    list.innerHTML = html;
    showCount();
}

/* ========== MARK PRESENT ========== */
function markPresent(i) {
    const current = students[i].attendance[selectedDate] || "Not Marked";

    if (current === "Present") {
        showToast("Already marked Present on " + selectedDate + ".", "error");
        return;
    }

    if (current === "Absent") {
        showToast("Cannot change Absent to Present for " + selectedDate + ".", "error");
        return;
    }

    students[i].attendance[selectedDate] = "Present";
    saveStudents();
    showStudents();
    showToast(students[i].namee + " marked Present on " + selectedDate + " ✅", "success");
}

/* ========== MARK ABSENT ========== */
function markAbsent(i) {
    const current = students[i].attendance[selectedDate] || "Not Marked";

    if (current === "Absent") {
        showToast("Already marked Absent on " + selectedDate + ".", "error");
        return;
    }

    if (current === "Present") {
        showToast("Cannot change Present to Absent for " + selectedDate + ".", "error");
        return;
    }

    students[i].attendance[selectedDate] = "Absent";
    saveStudents();
    showStudents();
    showToast(students[i].namee + " marked Absent on " + selectedDate + " ❌", "success");
}

/* ========== DELETE STUDENT ========== */
function deleteStudent(i) {
    const msg = "Delete " + students[i].namee +
                "? All their attendance history will be lost.";
    if (!confirm(msg)) return;

    const name = students[i].namee;
    students.splice(i, 1);
    saveStudents();
    showStudents();
    showToast(name + " deleted.", "success");
}

/* ========== EDIT STUDENT ========== */
function editStudent(i) {
    const newName = prompt("Enter new name:", students[i].namee);
    if (newName === null) return;

    const newRoll = prompt("Enter new roll number:", students[i].rollno);
    if (newRoll === null) return;

    const n = newName.trim();
    const r = newRoll.trim();

    if (n === "" || r === "") {
        showToast("Both fields are required.", "error");
        return;
    }

    for (let j = 0; j < students.length; j++) {
        if (j !== i && students[j].rollno === r) {
            showToast("Roll number already exists.", "error");
            return;
        }
    }

    students[i].namee = n;
    students[i].rollno = r;
    saveStudents();
    showStudents();
    showToast("Student updated.", "success");
}

/* ========== VIEW HISTORY MODAL ========== */
function viewHistory(i) {
    const s = students[i];
    const dates = Object.keys(s.attendance).sort().reverse();

    let html = "<h3>📅 Attendance History — " +
               s.namee + " (Roll: " + s.rollno + ")</h3>";

    if (dates.length === 0) {
        html += "<p>No attendance records yet.</p>";
    } else {
        html += "<table style='width:100%;border-collapse:collapse;margin-top:15px;'>";
        html += "<tr style='background:#172B4D;color:white;'>";
        html += "<th style='padding:10px;text-align:left;'>Date</th>";
        html += "<th style='padding:10px;text-align:left;'>Status</th>";
        html += "</tr>";

        for (let k = 0; k < dates.length; k++) {
            const date = dates[k];
            const status = s.attendance[date];
            const color = status === "Present" ? "#047857" : "#B91C1C";
            const bg = k % 2 === 0 ? "#F8FAFC" : "#FFFFFF";

            html += "<tr style='background:" + bg + ";'>";
            html += "<td style='padding:10px;border-bottom:1px solid #E2E8F0;'>" +
                    date + "</td>";
            html += "<td style='padding:10px;border-bottom:1px solid #E2E8F0;" +
                    "color:" + color + ";font-weight:700;'>" + status + "</td>";
            html += "</tr>";
        }
        html += "</table>";
    }

    showModal(html);
}

/* ========== MODAL ========== */
function showModal(html) {
    const overlay = document.createElement("div");
    overlay.id = "modalOverlay";
    overlay.style.cssText =
        "position:fixed;inset:0;background:rgba(23,43,77,0.65);" +
        "display:flex;justify-content:center;align-items:center;" +
        "z-index:9999;padding:20px;font-family:Montserrat,sans-serif;";

    const box = document.createElement("div");
    box.style.cssText =
        "background:white;padding:30px;border-radius:14px;" +
        "max-width:500px;width:100%;max-height:80vh;overflow-y:auto;" +
        "box-shadow:0 20px 50px rgba(0,0,0,0.3);";
    box.innerHTML = html;

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.style.cssText =
        "margin-top:20px;width:100%;padding:12px;background:#172B4D;" +
        "color:white;border:none;border-radius:8px;cursor:pointer;" +
        "font-family:inherit;font-weight:600;";
    closeBtn.onclick = function () {
        overlay.remove();
    };
    box.appendChild(closeBtn);

    overlay.appendChild(box);
    overlay.onclick = function (e) {
        if (e.target === overlay) overlay.remove();
    };

    document.body.appendChild(overlay);
}

/* ========== COUNT (per date) ========== */
function showCount() {
    let present = 0;
    let absent = 0;

    for (let i = 0; i < students.length; i++) {
        const status = students[i].attendance[selectedDate] || "Not Marked";
        if (status === "Present") present++;
        if (status === "Absent") absent++;
    }

    const countBox = document.getElementById("count");
    countBox.innerHTML =
        "<h3>📊 " + selectedDate + "</h3>" +
        "<p><strong>Total Students:</strong> " + students.length + "</p>" +
        "<p style='color:#047857;'><strong>Present:</strong> " + present + "</p>" +
        "<p style='color:#B91C1C;'><strong>Absent:</strong> " + absent + "</p>";
    countBox.className = "count-style";
}

/* ========== SEARCH ========== */
function search() {
    const value = document.getElementById("search").value.trim().toLowerCase();
    const box = document.getElementById("searchedInfo");

    let html = "<h2>Search Results</h2>";
    let found = false;

    for (let i = 0; i < students.length; i++) {
        const s = students[i];
        const nameMatch = s.namee.toLowerCase().includes(value);
        const rollMatch = String(s.rollno).toLowerCase().includes(value);

        if (nameMatch || rollMatch) {
            const status = s.attendance[selectedDate] || "Not Marked";
            html += "<p><strong>Name:</strong> " + s.namee + "</p>";
            html += "<p><strong>Roll No:</strong> " + s.rollno + "</p>";
            html += "<p><strong>Status on " + selectedDate + ":</strong> " +
                    status + "</p><hr>";
            found = true;
        }
    }

    if (!found) html += "<p>No student found.</p>";

    box.innerHTML = html;
    box.className = "search-style";
}

/* ========== RESET ========== */
function resetAll() {
    const msg = "Delete ALL students for " + currentUser.name +
                "? All attendance history will be lost.";
    if (!confirm(msg)) return;

    students = [];
    saveStudents();
    showStudents();
    showToast("All students cleared.", "success");
}

/* ========== TOAST ========== */
function showToast(message, type) {
    const old = document.getElementById("toast");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.id = "toast";
    toast.textContent = message;
    toast.style.cssText =
        "position:fixed;bottom:30px;left:50%;transform:translateX(-50%);" +
        "padding:14px 24px;border-radius:10px;color:white;font-weight:600;" +
        "font-size:14px;z-index:99999;box-shadow:0 8px 20px rgba(0,0,0,0.25);" +
        "font-family:Montserrat,sans-serif;transition:opacity 0.3s;" +
        "max-width:90%;text-align:center;" +
        "background-color:" + (type === "error" ? "#B91C1C" : "#047857") + ";";

    document.body.appendChild(toast);

    setTimeout(function () {
        toast.style.opacity = "0";
        setTimeout(function () {
            toast.remove();
        }, 300);
    }, 2500);
}

/* ========== INIT RENDER ========== */
showStudents();