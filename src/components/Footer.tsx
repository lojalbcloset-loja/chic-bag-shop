import logoBk from "@/assets/images/logo/logo-lb-closet-bk.png";
import pagamentos from "@/assets/images/icons/formas-de-pagamento.png";
import seloSeguro from "@/assets/images/icons/selo-compra-segura.webp";

export function Footer() {
  return (
    <footer className="site-footer heybag-style" id="ajuda">
      <div className="newsletter-strip">
        <div className="newsletter-inner">
          <div className="newsletter-text">
            <h2>
              GOSTOU DA
              <br />NOSSA LOJA?
            </h2>
            <p>
              ENTÃO, CADASTRE-SE E RECEBA TODAS AS
              <br />NOSSAS NOVIDADES NO SEU E-MAIL
            </p>
          </div>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Seu e-mail" required />
            <button type="submit">Assinar</button>
          </form>
        </div>
      </div>

      <div className="footer-main-area">
        <div className="footer-main-grid">
          <section className="footer-col footer-col-contact">
            <h3>ENTRE EM CONTATO</h3>
            <a
              href="https://wa.me/5562985388100"
              target="_blank"
              rel="noreferrer"
              className="contact-link"
            >
              <svg className="footer-icon-svg" viewBox="0 0 24 24" width="16" height="16" fill="#b19286">
                <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.115.548 4.184 1.585 6.002L.092 23.473l5.58-1.464a12.035 12.035 0 006.359 1.802h.004c6.645 0 12.032-5.385 12.032-12.031S18.677 0 12.031 0z" />
              </svg>
              (62) 9 8538-8100
            </a>
            <a href="mailto:contato@lbcloset.com.br" className="contact-link">
              <svg className="footer-icon-svg" viewBox="0 0 24 24" width="16" height="16" fill="#b19286">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
              contato@lbcloset.com.br
            </a>
            <div className="footer-brand-logo">
              <img src={logoBk} alt="Lb Closet Logo" className="footer-logo-img" />
            </div>
          </section>

          <section className="footer-col">
            <h3>INSTITUCIONAL</h3>
            <a href="#">Prazo de Produção e Envio</a>
            <a href="#">Política de Troca e Devolução de Produtos</a>
          </section>

          <section className="footer-col">
            <h3>INFORMAÇÕES</h3>
            <a href="#">Meus Pedidos</a>
            <a href="#">Meus Dados</a>
            <a href="#">Contato</a>
            <h3 className="social-heading">NOSSAS REDES</h3>
            <div className="social-links">
              <a href="#">lbcloset</a>
              <a href="#">lb.closet</a>
            </div>
          </section>

          <section className="footer-col footer-payments-security">
            <h3>FORMAS DE PAGAMENTO</h3>
            <div className="payment-icons-row">
              <img src={pagamentos} alt="Formas de Pagamento" />
            </div>
            <h3 className="security-heading">COMPRE COM SEGURANÇA</h3>
            <div className="security-icons-row">
              <img src={seloSeguro} alt="Selo Compra Segura" />
            </div>
          </section>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <p>
          LB CLOSET COMÉRCIO DE BOLSAS E ACESSÓRIOS
          <br />CNPJ: 50.814.331/0001-33
        </p>
        <p className="developed-by">
          Desenvolvido por{" "}
          <a href="#" target="_blank" rel="noreferrer">
            <strong>OneSet Digital</strong>
          </a>
        </p>
      </div>
    </footer>
  );
}
