// 한국 시간대 기준 날짜 처리
function getTodayStr() {
    const now = new Date();
    now.setHours(now.getHours() + 9 - now.getTimezoneOffset() / 60); // KST 보정
    return now.toISOString().slice(0, 10);
}

// 할 일 데이터 구조: { id, text, date, completed }
let todos = [];
const STORAGE_KEY = 'todo-list-v1';

function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}
function loadTodos() {
    const data = localStorage.getItem(STORAGE_KEY);
    todos = data ? JSON.parse(data) : [];
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1800);
}

// 리스트 뷰 렌더링
function renderListView() {
    const listView = document.getElementById('list-view');
    listView.innerHTML = '';
    if (todos.length === 0) {
        listView.innerHTML = '<div style="text-align:center;color:#888;">할 일이 없습니다.</div>';
        return;
    }
    todos.sort((a, b) => a.date.localeCompare(b.date));
    todos.forEach(todo => {
        const item = document.createElement('div');
        item.className = 'todo-item' + (todo.completed ? ' completed' : '');
        item.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}">
            <span class="todo-text">${todo.text}</span>
            <span class="todo-date">${todo.date}</span>
            <span class="todo-actions">
                <button class="edit-btn" data-id="${todo.id}" title="수정">✏️</button>
                <button class="delete-btn" data-id="${todo.id}" title="삭제">🗑️</button>
            </span>
        `;
        listView.appendChild(item);
    });
}

// 달력 뷰 렌더링
function renderCalendarView() {
    const calendarView = document.getElementById('calendar-view');
    calendarView.innerHTML = '';
    const now = new Date();
    now.setHours(now.getHours() + 9 - now.getTimezoneOffset() / 60); // KST
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    // 요일 헤더
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    let html = '<table class="calendar"><thead><tr>';
    weekDays.forEach(d => html += `<th>${d}</th>`);
    html += '</tr></thead><tbody><tr>';
    // 빈 칸
    for (let i = 0; i < startDay; i++) html += '<td></td>';
    // 날짜
    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayTodos = todos.filter(t => t.date === dateStr);
        const isToday = dateStr === getTodayStr();
        html += `<td class="${isToday ? 'today' : ''}"><div>${d}</div>`;
        if (dayTodos.length > 0) {
            html += '<div class="todo-list-in-cell">';
            dayTodos.slice(0, 3).forEach(t => {
                html += `<div>${t.completed ? '✔️ ' : ''}${t.text.length > 8 ? t.text.slice(0,8)+'…' : t.text}</div>`;
            });
            if (dayTodos.length > 3) html += `<div>+${dayTodos.length-3}개</div>`;
            html += '</div>';
        }
        html += '</td>';
        if ((startDay + d) % 7 === 0 && d !== totalDays) html += '</tr><tr>';
    }
    // 빈 칸
    const remain = (startDay + totalDays) % 7;
    if (remain !== 0) for (let i = remain; i < 7; i++) html += '<td></td>';
    html += '</tr></tbody></table>';
    calendarView.innerHTML = html;
}

// 뷰 전환
function setView(view) {
    const listView = document.getElementById('list-view');
    const calendarView = document.getElementById('calendar-view');
    listView.classList.toggle('active', view === 'list');
    calendarView.classList.toggle('active', view === 'calendar');
    document.getElementById('list-view-btn').classList.toggle('active', view === 'list');
    document.getElementById('calendar-view-btn').classList.toggle('active', view === 'calendar');
    // display 속성 직접 제어 (명확하게)
    if (view === 'list') {
        listView.style.display = 'flex';
        calendarView.style.display = 'none';
    } else {
        listView.style.display = 'none';
        calendarView.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    renderListView();
    renderCalendarView();
    document.getElementById('todo-date').value = getTodayStr();

    // 뷰 토글
    document.getElementById('list-view-btn').onclick = () => {
        setView('list');
    };
    document.getElementById('calendar-view-btn').onclick = () => {
        setView('calendar');
    };

    // 할 일 추가
    document.getElementById('add-btn').onclick = () => {
        const text = document.getElementById('todo-input').value.trim();
        const date = document.getElementById('todo-date').value;
        if (!text) {
            showToast('할 일을 입력하세요!');
            return;
        }
        if (!date) {
            showToast('날짜를 선택하세요!');
            return;
        }
        const newTodo = {
            id: Date.now().toString(),
            text,
            date,
            completed: false
        };
        todos.push(newTodo);
        saveTodos();
        renderListView();
        renderCalendarView();
        document.getElementById('todo-input').value = '';
        showToast('할 일이 추가되었습니다!');
    };

    // 리스트 뷰 내 이벤트 위임 (수정, 삭제, 체크)
    document.getElementById('list-view').onclick = (e) => {
        const target = e.target;
        const id = target.dataset.id;
        if (target.classList.contains('delete-btn')) {
            todos = todos.filter(t => t.id !== id);
            saveTodos();
            renderListView();
            renderCalendarView();
            showToast('삭제되었습니다.');
        } else if (target.classList.contains('edit-btn')) {
            const todo = todos.find(t => t.id === id);
            if (todo) {
                const newText = prompt('할 일을 수정하세요:', todo.text);
                if (newText !== null && newText.trim() !== '') {
                    todo.text = newText.trim();
                    saveTodos();
                    renderListView();
                    renderCalendarView();
                    showToast('수정되었습니다.');
                }
            }
        } else if (target.classList.contains('todo-checkbox')) {
            const todo = todos.find(t => t.id === id);
            if (todo) {
                todo.completed = target.checked;
                saveTodos();
                renderListView();
                renderCalendarView();
            }
        }
    };

    // 체크박스 별도 처리 (이벤트 위임이 input에선 동작 X)
    document.getElementById('list-view').addEventListener('change', (e) => {
        const target = e.target;
        if (target.classList.contains('todo-checkbox')) {
            const id = target.dataset.id;
            const todo = todos.find(t => t.id === id);
            if (todo) {
                todo.completed = target.checked;
                saveTodos();
                renderListView();
                renderCalendarView();
            }
        }
    });

    // 공유 버튼
    document.getElementById('share-btn').onclick = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            showToast('공유 링크가 복사되었습니다!');
        });
    };
}); 