import { useShop } from "@/store/shop";

export function LoginDrawer() {
  const open = useShop((s) => s.loginOpen);
  const setOpen = useShop((s) => s.setLoginOpen);
  return (
    <aside className={`login-drawer ${open ? "open" : ""}`} aria-hidden={!open}>
      <header>
        <strong>Login</strong>
        <button type="button" aria-label="Fechar login" onClick={() => setOpen(false)}>
          ×
        </button>
      </header>
      <form onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="login-user">CPF ou e-mail</label>
        <input id="login-user" type="text" placeholder="OBRIGATÓRIO" />
        <label htmlFor="login-pass">Senha</label>
        <input id="login-pass" type="password" placeholder="OBRIGATÓRIO" />
        <button type="button">Entrar</button>
        <a href="#">Criar uma conta</a>
        <a href="#">Esqueceu sua senha?</a>
      </form>
    </aside>
  );
}
