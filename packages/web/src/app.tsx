import { useEffect, useState } from "preact/hooks";
import {
  matchesTodoFilter,
  parseTags,
  PASSWORD_MIN_LENGTH,
  validatePassword,
  validateUsername,
  type Todo,
  type User,
} from "@asimov/shared";
import * as api from "./api";

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (api.getToken() === null) {
      setReady(true);
      return;
    }
    api
      .me()
      .then(({ user: u }) => setUser(u))
      .catch(() => api.setToken(null))
      .finally(() => setReady(true));
  }, []);

  function logout() {
    api.setToken(null);
    setUser(null);
  }

  if (!ready) return null;
  return (
    <main class="app">
      {user === null ? (
        <AuthScreen onAuthed={setUser} />
      ) : (
        <TodoScreen user={user} onLogout={logout} />
      )}
    </main>
  );
}

function AuthScreen({ onAuthed }: { onAuthed: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signup = mode === "signup";
  const mismatch = signup && confirm !== "" && password !== confirm;
  const incomplete = username === "" || password === "" || (signup && confirm === "");
  // the same shared rules the server enforces, checked before the round-trip
  const usernameError = signup && username !== "" ? validateUsername(username) : null;
  const passwordError = signup && password !== "" ? validatePassword(password) : null;
  const invalid = usernameError !== null || passwordError !== null;

  async function submit(event: Event) {
    event.preventDefault();
    if (busy || mismatch || incomplete || invalid) return;
    setBusy(true);
    setError(null);
    try {
      const credentials: api.Credentials = { username, password };
      if (signup && email !== "") credentials.email = email;
      const { user, token } = signup ? await api.signup(credentials) : await api.login(credentials);
      api.setToken(token);
      onAuthed(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError(null);
    setConfirm("");
  }

  return (
    <section class="card auth">
      <h1>todos</h1>
      <div class="tabs" role="tablist">
        <button
          type="button"
          class={mode === "login" ? "active" : ""}
          onClick={() => switchMode("login")}
        >
          Log in
        </button>
        <button
          type="button"
          class={mode === "signup" ? "active" : ""}
          onClick={() => switchMode("signup")}
        >
          Sign up
        </button>
      </div>
      <form onSubmit={(e) => void submit(e)}>
        <label>
          Username
          <input
            value={username}
            onInput={(e) => setUsername(e.currentTarget.value)}
            autocomplete="username"
            placeholder="a-z, 0-9, - and _"
          />
        </label>
        {signup && (
          <label>
            Email <span class="hint">(optional)</span>
            <input
              type="email"
              value={email}
              onInput={(e) => setEmail(e.currentTarget.value)}
              autocomplete="email"
            />
          </label>
        )}
        <label>
          Password
          <input
            type="password"
            value={password}
            onInput={(e) => setPassword(e.currentTarget.value)}
            autocomplete={signup ? "new-password" : "current-password"}
            placeholder={`at least ${PASSWORD_MIN_LENGTH} characters`}
          />
        </label>
        {signup && (
          <label>
            Repeat password
            <input
              type="password"
              value={confirm}
              onInput={(e) => setConfirm(e.currentTarget.value)}
              autocomplete="new-password"
            />
          </label>
        )}
        {usernameError !== null && <p class="error">Username: {usernameError}</p>}
        {passwordError !== null && <p class="error">Password: {passwordError}</p>}
        {mismatch && <p class="error">Passwords don't match.</p>}
        {error !== null && <p class="error">{error}</p>}
        <button type="submit" disabled={busy || mismatch || incomplete || invalid}>
          {signup ? "Create account" : "Log in"}
        </button>
      </form>
    </section>
  );
}

function TodoScreen({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { todos: list } = await api.listTodos();
    setTodos(list);
  }

  function handle(err: unknown) {
    if (err instanceof api.ApiError && err.status === 401) {
      onLogout();
      return;
    }
    if (err instanceof api.ApiError && err.status === 409) {
      // optimistic concurrency: someone else (another tab?) changed it first
      setError("This todo changed in another tab — list reloaded, please retry.");
      refresh().catch(() => undefined);
      return;
    }
    setError(err instanceof Error ? err.message : String(err));
  }

  useEffect(() => {
    refresh().catch(handle);
  }, []);

  async function add(event: Event) {
    event.preventDefault();
    const trimmed = title.trim();
    if (trimmed === "") return;
    const tagList = parseTags(tags);
    try {
      const { todo } = await api.createTodo(
        tagList.length > 0 ? { title: trimmed, tags: tagList } : { title: trimmed },
      );
      setTodos((current) => [...current, todo]);
      setTitle("");
      setTags("");
      setError(null);
    } catch (err) {
      handle(err);
    }
  }

  async function toggle(todo: Todo) {
    try {
      const { todo: updated } = await api.updateTodo(todo.id, {
        done: !todo.done,
        version: todo.version,
      });
      setTodos((current) => current.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      handle(err);
    }
  }

  async function remove(todo: Todo) {
    try {
      await api.deleteTodo(todo.id, todo.version);
      setTodos((current) => current.filter((t) => t.id !== todo.id));
    } catch (err) {
      handle(err);
    }
  }

  const visible = todos.filter((t) => matchesTodoFilter(t, filter === null ? {} : { tag: filter }));

  return (
    <section class="card todos">
      <header>
        <h1>todos</h1>
        <span class="who">
          {user.username} <button type="button" onClick={onLogout}>Log out</button>
        </span>
      </header>
      <form onSubmit={(e) => void add(e)}>
        <input
          class="grow"
          value={title}
          onInput={(e) => setTitle(e.currentTarget.value)}
          placeholder="What needs doing?"
          aria-label="Title"
        />
        <input
          value={tags}
          onInput={(e) => setTags(e.currentTarget.value)}
          placeholder="tags, comma, separated"
          aria-label="Tags"
        />
        <button type="submit" disabled={title.trim() === ""}>
          Add
        </button>
      </form>
      {error !== null && <p class="error">{error}</p>}
      {filter !== null && (
        <p class="filter">
          Showing <strong>#{filter}</strong>{" "}
          <button type="button" onClick={() => setFilter(null)}>
            clear
          </button>
        </p>
      )}
      <ul>
        {visible.map((todo) => (
          <li key={todo.id} class={todo.done ? "done" : ""}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => void toggle(todo)}
              aria-label={`Done: ${todo.title}`}
            />
            <span class="title">{todo.title}</span>
            {todo.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                class={`tag ${tag === filter ? "active" : ""}`}
                onClick={() => setFilter(tag === filter ? null : tag)}
              >
                #{tag}
              </button>
            ))}
            <button
              type="button"
              class="delete"
              onClick={() => void remove(todo)}
              aria-label={`Delete: ${todo.title}`}
            >
              ✕
            </button>
          </li>
        ))}
        {visible.length === 0 && <li class="empty">Nothing here.</li>}
      </ul>
    </section>
  );
}
