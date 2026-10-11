import { Link } from "react-router-dom";
import { useCatalog } from "./CatalogProvider";
import { useCart } from "../cart/CartProvider";
import { formatMoney } from "../../domain/money";
import { ContactForm } from "../contact/ContactForm";
import { Button } from "../../components/Button";
import { StatusNotice } from "../../components/StatusNotice";
import { stories } from "./stories";
export function LandingPage() {
  const catalog = useCatalog(),
    cart = useCart(),
    spotlight = catalog.products.find((p) => p.slug === "lobster-thermidor");
  return (
    <>
      <section className="landing-hero">
        <img
          src="/assets/editorial-dining-room.webp"
          alt="A warmly lit dining room with tables ready for good company"
          width="1920"
          height="1280"
          fetchPriority="high"
        />
        <div className="hero-copy page-width">
          <span className="eyebrow">
            Come for the flavour. Stay for the feeling.
          </span>
          <h1>
            Make an evening
            <br />
            of every meal.
          </h1>
          <p>
            A table to gather around.
            <br />A menu to fall in love with.
          </p>
          <div className="hero-actions">
            <Link className="button" to="/menu">
              Discover the menu →
            </Link>
            <a className="button hero-outline" href="#our-story">
              Meet C’est Délicieux
            </a>
          </div>
        </div>
        <span className="hero-caption">
          GOOD COMPANY. EXTRAORDINARY FLAVOUR.
        </span>
      </section>
      <div className="page-width">
        <section className="spotlight-section">
          <div className="section-heading">
            <span className="eyebrow">In the spotlight</span>
            <Link to="/menu">Explore every dish →</Link>
          </div>
          <div className="spotlight">
            <img
              src="/assets/editorial-lobster.webp"
              alt="Lobster Thermidor"
              loading="lazy"
              width="1200"
              height="800"
            />
            <div>
              <span className="eyebrow">
                Lobster Thermidor{" "}
                {spotlight && `/ ${formatMoney(spotlight.priceCentavos)}`}
              </span>
              <h2>
                The centrepiece
                <br />
                of your next meal.
              </h2>
              <p>
                Explore one of our signature menu dishes,
                <br />
                then make the evening your own.
              </p>
              {spotlight ? (
                <Button onClick={() => cart.add(spotlight.id)}>
                  + Add to order
                </Button>
              ) : (
                <Link className="button" to="/menu">
                  Explore the menu →
                </Link>
              )}
              <StatusNotice error message={cart.error} />
            </div>
          </div>
          <div className="landing-categories">
            {["Starters", "Mains", "Vegetables", "Desserts", "Drinks"].map(
              (name, i) => (
                <Link to="/menu" key={name}>
                  <span>0{i + 1}</span>
                  {name} ↗
                </Link>
              ),
            )}
          </div>
        </section>
        <section className="restaurant-story" id="our-story">
          <div>
            <span className="eyebrow">Our story</span>
            <h2>
              Hospitality,
              <br />
              from the heart.
            </h2>
            <p>
              Thoughtful details, attentive service, and food
              <br />
              made to bring people together.
            </p>
            <Link className="text-link" to={`/stories/${stories[0].slug}`}>
              Discover our story →
            </Link>
          </div>
          <img
            src="/assets/editorial-restaurant.webp"
            alt="The restaurant interior"
            loading="lazy"
            width="1200"
            height="800"
          />
        </section>
        <section className="journal">
          <div className="section-heading">
            <div>
              <span className="eyebrow">From our journal</span>
              <h2>Stories worth sharing.</h2>
            </div>
          </div>
          <div className="journal-grid">
            {stories.map((s) => (
              <Link
                className="journal-card"
                to={`/stories/${s.slug}`}
                key={s.slug}
              >
                <img src={s.image} alt="" loading="lazy" />
                <span className="eyebrow">
                  From the original restaurant journal
                </span>
                <h3>{s.title}</h3>
                <span>Read the story →</span>
              </Link>
            ))}
          </div>
        </section>
        <ContactForm />
      </div>
    </>
  );
}
