import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const CLIP_FROM = 'inset(9% 9% 9% 9% round 22px)';
const CLIP_TO = 'inset(0% 0% 0% 0% round 0px)';

const stickyTop = () => {
  const header = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--header-height')
  );
  return (header || 64) + 20;
};

/**
 * Efecto parallax sutil para imágenes en carruseles horizontales.
 * Las imágenes escalan y traducen ligeramente al entrar en viewport.
 */
const carouselImageParallax = (img) => {
  if (!img) return;

  gsap.fromTo(
    img,
    { scale: 1.15, yPercent: 10 },
    {
      scale: 1,
      yPercent: 0,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: img.closest('.category-carousel-card') || img,
        start: 'left 95%',
        end: 'left 30%',
        scrub: 0.6,
        once: false
      }
    }
  );
};

/**
 * Efecto parallax para la imagen principal del producto en ProductDetail.
 * Zoom sutil al hacer scroll sobre la galería.
 */
const productGalleryParallax = (container) => {
  const img = container.querySelector('img');
  if (!img) return;

  gsap.fromTo(
    img,
    { scale: 1.05 },
    {
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: container,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.8
      }
    }
  );
};

/**
 * Efecto de entrada para el mapa de contacto.
 * Fade + scale suave al aparecer.
 */
const contactMapReveal = (map) => {
  if (!map) return;

  gsap.fromTo(
    map,
    { scale: 0.92, autoAlpha: 0, y: 30 },
    {
      scale: 1,
      autoAlpha: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: map,
        start: 'top 85%',
        once: true
      }
    }
  );
};

/**
 * Efecto parallax para la sección destacada/banner (featured product banner).
 * El fondo se mueve a diferente velocidad que el contenido.
 */
const featuredBannerParallax = (section) => {
  const bg = section.querySelector('.featured-banner-bg');
  const content = section.querySelector('.featured-banner-content');
  if (!bg || !content) return;

  gsap.to(bg, {
    yPercent: -30,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.5
    }
  });

  gsap.to(content, {
    yPercent: 15,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.5
    }
  });
};

/**
 * Efectos de scroll (parallax + imágenes que se expanden).
 * No renderiza nada: localiza las imágenes por selector, incluidas las que
 * llegan tarde desde la API o al navegar, y anima cada una una sola vez.
 * Respeta prefers-reduced-motion y revierte todo al cambiar de preferencia.
 */
const ScrollFx = () => {
  useEffect(() => {
    const mm = gsap.matchMedia();

    mm.add(
      { motion: '(prefers-reduced-motion: no-preference)', wide: '(min-width: 1101px)' },
      (ctx) => {
        const { motion, wide } = ctx.conditions;
        if (!motion) return undefined;

        const seen = new WeakSet();
        let added = false;
        let timer;

        const fresh = (selector) =>
          Array.from(document.querySelectorAll(selector)).filter((el) => {
            if (seen.has(el)) return false;
            seen.add(el);
            added = true;
            return true;
          });

        const refreshSoon = () => {
          clearTimeout(timer);
          timer = setTimeout(() => ScrollTrigger.refresh(), 150);
        };

        // Hero: el panel con el producto crece de tarjeta a media portada
        // mientras el hero queda fijo (sticky) y el texto sube más despacio.
        const heroExpand = (stage) => {
          const hero = stage.querySelector('.hero');
          const visual = stage.querySelector('.hero-visual');
          const img = visual && visual.querySelector('img');
          if (!hero || !img) {
            seen.delete(stage); // reintenta cuando llegue la imagen
            return;
          }

          gsap
            .timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: stage,
                start: () => `top top+=${stickyTop()}`,
                end: () => `bottom top+=${stickyTop() + hero.offsetHeight}`,
                scrub: 0.8,
                invalidateOnRefresh: true
              }
            })
            .fromTo(
              visual,
              { top: 34, bottom: 34, right: 40, width: '38%', borderRadius: 22 },
              { top: 0, bottom: 0, right: 0, width: '54%', borderRadius: 0, ease: 'power2.inOut' },
              0
            )
            .fromTo(img, { scale: 1.3 }, { scale: 1 }, 0)
            .fromTo(visual, { '--shade': 0 }, { '--shade': 1 }, 0)
            .to(hero.querySelector('.hero-content'), { y: -40 }, 0);
        };

        // Tarjetas: el marco se abre (clip-path) y la imagen se asienta (scale)
        // al entrar; además la imagen se desplaza suave dentro del marco (parallax).
        const cardExpand = (frame) => {
          const img = frame.querySelector('img');
          if (!img) return;
          const enter = () => ({ trigger: frame, start: 'top 94%', end: 'top 50%', scrub: 0.7 });

          gsap.fromTo(
            frame,
            { clipPath: CLIP_FROM },
            { clipPath: CLIP_TO, ease: 'power2.out', scrollTrigger: enter() }
          );
          gsap.fromTo(
            img,
            { scale: 1.34 },
            { scale: 1.1, ease: 'power2.out', scrollTrigger: enter() }
          );
          gsap.fromTo(
            img,
            { yPercent: -5 },
            {
              yPercent: 5,
              ease: 'none',
              scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true }
            }
          );
        };

        // Categorías: los círculos se expanden en cascada al aparecer.
        const categoriesPop = (imgs) => {
          if (!imgs.length) return;
          gsap.set(imgs, { scale: 0.35, rotate: -14, autoAlpha: 0 });
          ScrollTrigger.batch(imgs, {
            start: 'top 92%',
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, {
                scale: 1,
                rotate: 0,
                autoAlpha: 1,
                duration: 0.9,
                ease: 'back.out(1.7)',
                stagger: 0.07,
                overwrite: true
              })
          });
        };

        const scan = () => {
          // Elimina triggers de páginas que ya se desmontaron (navegación SPA)
          ScrollTrigger.getAll().forEach((t) => {
            if (t.trigger && !t.trigger.isConnected) {
              t.animation?.kill();
              t.kill();
            }
          });

          ctx.add(() => {
            if (wide) fresh('.hero-stage').forEach(heroExpand);
            fresh('.product-image-wrap').forEach(cardExpand);
            categoriesPop(fresh('.category-card img'));

            // Carrusel de categorías: parallax sutil en imágenes
            fresh('.category-carousel-media img').forEach(carouselImageParallax);

            // Galería de producto: parallax zoom en imagen principal
            fresh('.detail-main-image').forEach(productGalleryParallax);

            // Mapa de contacto: revelación con fade + scale
            fresh('.contact-map').forEach(contactMapReveal);

            // Banner destacado: parallax de fondo y contenido
            fresh('.featured-banner').forEach(featuredBannerParallax);
          });

          if (added) {
            added = false;
            refreshSoon();
          }
        };

        const observer = new MutationObserver(scan);
        observer.observe(document.getElementById('root'), { childList: true, subtree: true });

        // Al cargar una imagen cambian las alturas: se recalculan las posiciones.
        const onImgLoad = (e) => {
          if (e.target.tagName === 'IMG') refreshSoon();
        };
        document.addEventListener('load', onImgLoad, true);

        scan();

        return () => {
          observer.disconnect();
          document.removeEventListener('load', onImgLoad, true);
          clearTimeout(timer);
        };
      }
    );

    return () => mm.revert();
  }, []);

  return null;
};

export default ScrollFx;
