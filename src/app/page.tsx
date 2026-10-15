import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/billing/plans";
import {
  ArrowDown,
  ArrowUpRight,
  Camera,
  Check,
  Focus,
  Menu,
  MoveUpRight,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "Perfect Shot — Be yourself. Nail the shot.",
  description:
    "Live pose, framing and lighting guidance. Better direction. Still entirely you. Find your angle with Perfect Shot, the on-device photography coach.",
};

const features = [
  {
    title: "Live pose guidance",
    text: "Pick a pose and follow the outline. Small adjustments, a little more confidence.",
  },
  {
    title: "Pose, framing & light",
    text: "Helpful prompts for your pose, distance, framing and lighting — right in the camera.",
  },
  {
    title: "Smart shutter",
    text: "Hold a matching pose for automatic capture, or take the shot yourself. You stay in control.",
  },
];

const scenes = [
  {
    name: "Standing",
    image: "hero-standing.png",
    alt: "A relaxed standing pose in a sunlit limestone colonnade",
  },
  {
    name: "Chair",
    image: "pose-chair.png",
    alt: "A woman sitting comfortably on a cafe chair in soft window light",
  },
  {
    name: "Sofa",
    image: "pose-sofa.png",
    alt: "A man sitting naturally on a sofa in a warm minimalist living room",
  },
  {
    name: "Stage",
    image: "pose-stage.png",
    alt: "A woman standing confidently in a warm spotlight on a dark stage",
  },
];

export default function Home() {
  return (
    <div className={styles.landing}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>
      <div className={styles.heroShell}>
        <header className={styles.header}>
          <Link
            href="/"
            className={styles.brand}
            aria-label="Perfect Shot home"
          >
            <Image
              src="/icon-192.png"
              width={31}
              height={31}
              alt=""
              unoptimized
            />
            <span>
              perfect<span className={styles.brandLight}>shot</span>
            </span>
          </Link>
          <nav className={styles.navigation} aria-label="Main navigation">
            <a href="#the-experience">The experience</a>
            <a href="#pose-library">Pose library</a>
            <a href="#pricing" className={styles.pricingNavLink}>
              Pricing
            </a>
            <a href="#privacy">Your privacy</a>
          </nav>
          <details className={styles.mobileMenu}>
            <summary>
              Menu <Menu size={20} aria-hidden="true" />
            </summary>
            <nav aria-label="Mobile navigation">
              <a href="#the-experience">The experience</a>
              <a href="#pose-library">Pose library</a>
              <a href="#pricing">Pricing</a>
              <a href="#privacy">Your privacy</a>
              <Link href="/camera">
                Open camera <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </nav>
          </details>
          <Link href="/camera" className={styles.headerCta}>
            Open camera <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </header>

        <main id="main-content">
          <section className={styles.hero} aria-labelledby="hero-title">
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>More you. The AI photo coach.</p>
              <h1 id="hero-title">
                Be yourself.
                <br />
                <em>Nail the shot.</em>
              </h1>
              <p className={styles.heroDescription}>
                Live pose, framing and lighting guidance.
                <br />
                Better direction. Still entirely you.
              </p>
              <div className={styles.heroActions}>
                <Button asChild className={styles.primaryCta}>
                  <Link href="/camera">
                    Open camera <ArrowUpRight size={17} aria-hidden="true" />
                  </Link>
                </Button>
                <a href="#the-experience" className={styles.textLink}>
                  See how it works <ArrowDown size={14} aria-hidden="true" />
                </a>
              </div>
              <p className={styles.privacyNote}>
                <ShieldCheck size={13} aria-hidden="true" /> On your device.
                Free to start.
              </p>
            </div>
            <figure className={styles.heroMedia}>
              <Image
                src="/images/landing/hero-standing.png"
                alt="A woman standing naturally in warm sunlight beside a limestone colonnade"
                fill
                sizes="(max-width: 760px) 100vw, 56vw"
                preload
              />
              <svg
                className={styles.heroGuide}
                viewBox="0 0 600 760"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true"
              >
                <path d="M35 96V54H78 M522 54H565V96 M565 664V706H522 M78 706H35V664" />
              </svg>
              <span className={styles.heroNote}>
                That’s the pose.
                <br />
                <strong>Make it yours.</strong>
                <MoveUpRight size={22} aria-hidden="true" />
              </span>
              <div className={styles.heroPrint} aria-hidden="true">
                <Image
                  src="/images/landing/hero-standing.png"
                  alt=""
                  fill
                  sizes="160px"
                />
                <span>STILL YOU.</span>
              </div>
              <figcaption className={styles.heroCaption}>
                A little guidance. A moment worth keeping.
              </figcaption>
            </figure>
          </section>

          <div
            className={styles.benefitStrip}
            role="group"
            aria-label="Perfect Shot features"
          >
            <span>
              <Focus size={16} aria-hidden="true" /> Choose your pose
            </span>
            <span>
              <MoveUpRight size={16} aria-hidden="true" /> Follow the guide
            </span>
            <span>
              <Camera size={16} aria-hidden="true" /> Keep what feels like you
            </span>
          </div>

          <section
            className={styles.experienceSection}
            id="the-experience"
            aria-labelledby="experience-title"
          >
            <figure className={styles.cameraFigure}>
              <div className={styles.cameraDemo}>
                <div className={styles.cameraRail} aria-hidden="true">
                  <span>PERFECT SHOT</span>
                  <Focus size={16} />
                </div>
                <div className={styles.demoPhoto}>
                  <Image
                    src="/images/landing/pose-standing.png"
                    alt="Illustrative camera preview of a relaxed standing pose beside a stone building"
                    fill
                    sizes="(max-width: 760px) 77vw, 36vw"
                  />
                  <svg
                    className={styles.demoGuide}
                    viewBox="0 0 350 440"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M155 114L155 128Q132 124 125 144L108 202Q105 214 112 230L120 266Q123 275 132 270Q139 267 135 259L128 216L142 171L143 257L140 265L142 332L141 389Q141 402 156 402L167 402Q176 402 171 390L170 333L174 280L190 279L195 333L209 393Q208 402 221 403L235 402Q243 400 237 390L220 329L215 264L211 173L216 209L202 239Q197 248 206 252Q213 255 218 247L233 219Q241 210 235 199L220 146Q215 129 193 129L190 114Z" />
                    <ellipse cx="173" cy="92" rx="21" ry="27" />
                  </svg>
                  <span className={styles.demoBadge}>
                    <Focus size={12} aria-hidden="true" /> FIND YOUR ANGLE
                  </span>
                </div>
                <div className={styles.shutterRail} aria-hidden="true">
                  <Camera size={15} />
                  <span className={styles.shutter} />
                  <span>
                    SMART
                    <br />
                    SHUTTER
                  </span>
                </div>
              </div>
              <figcaption>
                Illustrative preview. Your moment looks different.
              </figcaption>
            </figure>
            <div className={styles.experienceCopy}>
              <p className={styles.eyebrow}>A little help. A lot more you.</p>
              <h2 id="experience-title">
                A little direction.
                <br />
                <em>A different picture.</em>
              </h2>
              <ol className={styles.features}>
                {features.map((feature, index) => (
                  <li key={feature.title}>
                    <span className={styles.featureNumber}>0{index + 1}</span>
                    <div>
                      <h3>{feature.title}</h3>
                      <p>{feature.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Link href="/camera" className={styles.darkTextLink}>
                Make a little room for your next shot{" "}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section
            className={styles.librarySection}
            id="pose-library"
            aria-labelledby="library-title"
          >
            <div className={styles.libraryIntro}>
              <div>
                <p className={styles.eyebrow}>Find your pose</p>
                <h2 id="library-title">
                  Different scenes.
                  <br />
                  <em>Same confidence.</em>
                </h2>
              </div>
              <p>
                For wherever you find yourself.
                <br />
                And however you want to show up.
              </p>
            </div>
            <div className={styles.sceneGrid}>
              {scenes.map((scene, index) => (
                <Link
                  href="/camera"
                  className={styles.sceneCard}
                  key={scene.name}
                  aria-label={
                    "Open camera to explore " +
                    scene.name.toLowerCase() +
                    " poses"
                  }
                >
                  <div className={styles.sceneImage}>
                    <Image
                      src={"/images/landing/" + scene.image}
                      alt={scene.alt}
                      fill
                      sizes="(max-width: 560px) 44vw, 23vw"
                    />
                    <span className={styles.sceneArrow}>
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </span>
                  </div>
                  <span className={styles.sceneLabel}>
                    <span>0{index + 1}</span>
                    {scene.name}
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/camera" className={styles.textLink}>
              Explore the pose library{" "}
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </section>

          <section
            className={styles.pricingSection}
            id="pricing"
            aria-labelledby="pricing-title"
          >
            <div className={styles.pricingIntro}>
              <div>
                <p className={styles.eyebrow}>Choose your coach</p>
                <h2 id="pricing-title">
                  Good direction.
                  <br />
                  <em>At your own pace.</em>
                </h2>
              </div>
              <p>
                Start with a little guidance.
                <br />
                Add a voice when you want one.
              </p>
            </div>
            <div className={styles.planGrid}>
              {PLANS.map((plan) => (
                <article
                  className={styles.planCard}
                  data-featured={plan.id === "starter"}
                  key={plan.id}
                  aria-labelledby={"plan-" + plan.id}
                >
                  <p className={styles.planTag}>
                    {plan.id === "free"
                      ? "Your first good angle"
                      : plan.id === "starter"
                        ? "A little more guidance"
                        : "The full coaching experience"}
                  </p>
                  <h3 id={"plan-" + plan.id}>{plan.name}</h3>
                  <p className={styles.planPrice}>
                    ${plan.price}
                    <span>
                      {plan.id === "free" ? " / forever" : " / month"}
                    </span>
                  </p>
                  <p className={styles.planDescription}>{plan.description}</p>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <Check size={14} aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {plan.id === "free" ? (
                    <Button asChild className={styles.planCta}>
                      <Link href="/camera">
                        Start free <ArrowUpRight size={16} aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : (
                    <form action="/api/checkout" method="post">
                      <input type="hidden" name="plan" value={plan.id} />
                      <Button type="submit" className={styles.planCta}>
                        Choose {plan.name}{" "}
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </Button>
                    </form>
                  )}
                </article>
              ))}
            </div>
            <p className={styles.pricingNote}>
              Prices in USD. Paid plans renew monthly and activate in the
              browser used at checkout. Voice coaching sends instruction text to
              ElevenLabs; your camera frames stay on your device.
            </p>
          </section>

          <section
            className={styles.privacySection}
            id="privacy"
            aria-labelledby="privacy-title"
          >
            <h2 id="privacy-title">
              Your photos.
              <br />
              <em>Your business.</em>
            </h2>
            <div>
              <ShieldCheck size={34} aria-hidden="true" />
              <p>
                Private photos, personal moments.
                <br />
                <span>
                  Pose detection stays on your device. Your camera frames aren’t
                  uploaded.
                </span>
              </p>
            </div>
          </section>

          <section className={styles.finalCta} aria-labelledby="final-title">
            <h2 id="final-title">
              THAT’S
              <br />
              THE ONE.
            </h2>
            <div>
              <p>Your next good photo starts with you.</p>
              <Button asChild className={styles.blackCta}>
                <Link href="/camera">
                  Find your perfect shot{" "}
                  <ArrowUpRight size={18} aria-hidden="true" />
                </Link>
              </Button>
              <span>
                Camera permission required. Save your favorites locally.
              </span>
            </div>
          </section>
        </main>

        <footer className={styles.footer}>
          <Link href="/" className={styles.brand}>
            <Image
              src="/icon-192.png"
              width={25}
              height={25}
              alt=""
              unoptimized
            />
            <span>
              perfect<span className={styles.brandLight}>shot</span>
            </span>
          </Link>
          <p>More moments. Better direction.</p>
          <a href="#privacy">Privacy</a>
          <a href="#main-content">Back to top ↑</a>
        </footer>
      </div>
    </div>
  );
}
