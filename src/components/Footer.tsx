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
              <a href="https://instagram.com/lbcloset" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M12 2.2c3.2 0 3.584.012 4.85.07 1.17.054 1.804.249 2.227.413.56.218.96.478 1.38.898.42.42.68.82.898 1.38.164.422.36 1.057.413 2.227.058 1.265.07 1.645.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.249 1.804-.413 2.227-.218.56-.478.96-.898 1.38-.42.42-.82.68-1.38.898-.422.164-1.057.36-2.227.413-1.265.058-1.645.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.804-.249-2.227-.413a3.7 3.7 0 01-1.38-.898 3.7 3.7 0 01-.898-1.38c-.164-.422-.36-1.057-.413-2.227C2.212 15.584 2.2 15.2 2.2 12s.012-3.584.07-4.85c.054-1.17.249-1.804.413-2.227.218-.56.478-.96.898-1.38.42-.42.82-.68 1.38-.898.422-.164 1.057-.36 2.227-.413C8.416 2.212 8.8 2.2 12 2.2zM12 0C8.74 0 8.332.014 7.052.072 5.775.13 4.902.333 4.14.63a5.9 5.9 0 00-2.135 1.39A5.9 5.9 0 00.63 4.14C.333 4.902.13 5.775.072 7.052.014 8.332 0 8.74 0 12s.014 3.668.072 4.948c.058 1.277.261 2.15.558 2.912a5.9 5.9 0 001.39 2.135 5.9 5.9 0 002.135 1.39c.762.297 1.635.5 2.912.558C8.332 23.986 8.74 24 12 24s3.668-.014 4.948-.072c1.277-.058 2.15-.261 2.912-.558a5.9 5.9 0 002.135-1.39 5.9 5.9 0 001.39-2.135c.297-.762.5-1.635.558-2.912C23.986 15.668 24 15.26 24 12s-.014-3.668-.072-4.948c-.058-1.277-.261-2.15-.558-2.912a5.9 5.9 0 00-1.39-2.135A5.9 5.9 0 0019.86.63C19.098.333 18.225.13 16.948.072 15.668.014 15.26 0 12 0zm0 5.838A6.162 6.162 0 105.838 12 6.162 6.162 0 0012 5.838zm0 10.162A4 4 0 1116 12a4 4 0 01-4 4zm6.406-11.845a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z"/>
                </svg>
                lbcloset
              </a>
              <a href="https://facebook.com/lb.closet" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.408.593 24 1.325 24H12.82v-9.294H9.692V11.08h3.128V8.412c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.464.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.31h3.587l-.467 3.626h-3.12V24h6.116c.73 0 1.323-.592 1.323-1.324V1.325C24 .593 23.407 0 22.675 0z"/>
                </svg>
                lb.closet
              </a>
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
