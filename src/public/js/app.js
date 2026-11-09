// Controlador de Interface e Fluxos da SPA
document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const authSection = document.getElementById('authSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const userSection = document.getElementById('userSection');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const logoutBtn = document.getElementById('logoutBtn');
  const healthBadge = document.getElementById('healthBadge');
  const healthText = document.getElementById('healthText');

  // Tabs Auth
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authAlert = document.getElementById('authAlert');

  // Filtros e Modal
  const filterStatus = document.getElementById('filterStatus');
  const filterPriority = document.getElementById('filterPriority');
  const openNewTaskBtn = document.getElementById('openNewTaskBtn');
  const taskModal = document.getElementById('taskModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const taskForm = document.getElementById('taskForm');
  const tasksList = document.getElementById('tasksList');
  const emptyTasks = document.getElementById('emptyTasks');

  // Inicialização do Health Check periódica
  async function pingHealth() {
    try {
      const data = await api.checkHealth();
      healthBadge.classList.remove('hidden');
      healthText.textContent = `API: ${data.status} (${data.latencyMs}ms)`;
    } catch {
      healthBadge.classList.remove('hidden');
      healthBadge.className = 'flex items-center space-x-2 text-xs bg-rose-950/80 text-rose-400 px-3 py-1.5 rounded-full border border-rose-800';
      healthText.textContent = 'API: Indisponível';
    }
  }
  pingHealth();
  setInterval(pingHealth, 15000);

  // Alternância de Tabs de Autenticação
  tabLogin.addEventListener('click', () => {
    tabLogin.className = 'flex-1 pb-3 text-sm font-semibold border-b-2 border-indigo-500 text-indigo-400';
    tabRegister.className = 'flex-1 pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200';
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    hideAlert();
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.className = 'flex-1 pb-3 text-sm font-semibold border-b-2 border-indigo-500 text-indigo-400';
    tabLogin.className = 'flex-1 pb-3 text-sm font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-200';
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    hideAlert();
  });

  function showAlert(msg, isError = true) {
    authAlert.textContent = msg;
    authAlert.className = `mt-4 p-3 rounded-lg text-xs ${isError ? 'bg-rose-950/80 text-rose-300 border border-rose-800' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'}`;
    authAlert.classList.remove('hidden');
  }

  function hideAlert() {
    authAlert.classList.add('hidden');
  }

  function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-xl text-xs font-medium shadow-2xl z-50 transition-all ${isError ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
  }

  // Submissão do Login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await api.login(email, password);
      api.setToken(res.data.token);
      api.setUser(res.data.user);
      renderDashboard();
      showToast('Bem-vindo(a) de volta!');
    } catch (err) {
      showAlert(err.message);
    }
  });

  // Submissão do Cadastro
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
      const res = await api.register(name, email, password);
      api.setToken(res.data.token);
      api.setUser(res.data.user);
      renderDashboard();
      showToast('Conta criada com sucesso!');
    } catch (err) {
      showAlert(err.message);
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    api.clearToken();
    renderAuth();
    showToast('Sessão encerrada.');
  });

  window.addEventListener('auth_expired', () => {
    renderAuth();
    showToast('Sessão expirada. Faça login novamente.', true);
  });

  function checkAuthState() {
    const token = api.getToken();
    if (token) {
      renderDashboard();
    } else {
      renderAuth();
    }
  }

  function renderAuth() {
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    userSection.classList.add('hidden');
  }

  async function renderDashboard() {
    const user = api.getUser();
    if (user) {
      userNameDisplay.textContent = user.name;
    }
    authSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    userSection.classList.remove('hidden');
    await loadTasks();
  }

  async function loadTasks() {
    const params = {};
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterPriority.value) params.priority = filterPriority.value;

    try {
      const res = await api.getTasks(params);
      const tasks = res.data;
      updateMetricsCards(tasks);
      renderTaskList(tasks);
    } catch (err) {
      showToast('Erro ao carregar tarefas: ' + err.message, true);
    }
  }

  function updateMetricsCards(tasks) {
    document.getElementById('statTotal').textContent = tasks.length;
    document.getElementById('statPending').textContent = tasks.filter(t => t.status === 'PENDENTE').length;
    document.getElementById('statInProgress').textContent = tasks.filter(t => t.status === 'EM_ANDAMENTO').length;
    document.getElementById('statCompleted').textContent = tasks.filter(t => t.status === 'CONCLUIDA').length;
  }

  function renderTaskList(tasks) {
    tasksList.innerHTML = '';
    if (tasks.length === 0) {
      emptyTasks.classList.remove('hidden');
      return;
    }
    emptyTasks.classList.add('hidden');

    tasks.forEach(task => {
      const card = document.createElement('div');
      card.className = 'task-card bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4';

      const priorityBadgeClass = `badge-${task.priority.toLowerCase()}`;

      card.innerHTML = `
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${priorityBadgeClass}">
              ${task.priority}
            </span>
            <h4 class="text-sm font-semibold text-white ${task.status === 'CONCLUIDA' ? 'line-through text-slate-500' : ''}">
              ${escapeHtml(task.title)}
            </h4>
          </div>
          <p class="text-xs text-slate-400">${escapeHtml(task.description || 'Sem descrição.')}</p>
          ${task.due_date ? `<p class="text-[11px] text-slate-500">Prazo: ${task.due_date.substring(0, 10)}</p>` : ''}
        </div>

        <div class="flex items-center space-x-3 self-end md:self-auto">
          <select data-id="${task.id}" class="task-status-select bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none">
            <option value="PENDENTE" ${task.status === 'PENDENTE' ? 'selected' : ''}>Pendente</option>
            <option value="EM_ANDAMENTO" ${task.status === 'EM_ANDAMENTO' ? 'selected' : ''}>Em Andamento</option>
            <option value="CONCLUIDA" ${task.status === 'CONCLUIDA' ? 'selected' : ''}>Concluída</option>
          </select>
          <button data-id="${task.id}" class="task-delete-btn text-xs text-rose-400 hover:text-rose-300 px-2 py-1 transition">
            Excluir
          </button>
        </div>
      `;

      tasksList.appendChild(card);
    });

    document.querySelectorAll('.task-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = e.target.getAttribute('data-id');
        const newStatus = e.target.value;
        try {
          await api.updateTask(id, { status: newStatus });
          showToast('Status atualizado!');
          loadTasks();
        } catch (err) {
          showToast(err.message, true);
        }
      });
    });

    document.querySelectorAll('.task-delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        if (confirm('Deseja realmente excluir esta tarefa?')) {
          try {
            await api.deleteTask(id);
            showToast('Tarefa excluída com sucesso.');
            loadTasks();
          } catch (err) {
            showToast(err.message, true);
          }
        }
      });
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  filterStatus.addEventListener('change', loadTasks);
  filterPriority.addEventListener('change', loadTasks);

  openNewTaskBtn.addEventListener('click', () => {
    taskForm.reset();
    document.getElementById('taskId').value = '';
    taskModal.classList.remove('hidden');
  });

  closeModalBtn.addEventListener('click', () => taskModal.classList.add('hidden'));
  cancelModalBtn.addEventListener('click', () => taskModal.classList.add('hidden'));

  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskData = {
      title: document.getElementById('taskTitle').value,
      description: document.getElementById('taskDesc').value,
      priority: document.getElementById('taskPriority').value,
      status: document.getElementById('taskStatus').value,
      dueDate: document.getElementById('taskDueDate').value || null
    };

    try {
      await api.createTask(taskData);
      taskModal.classList.add('hidden');
      showToast('Tarefa criada com sucesso!');
      loadTasks();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  checkAuthState();
});
