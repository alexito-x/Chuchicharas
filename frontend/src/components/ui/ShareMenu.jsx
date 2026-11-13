import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Facebook, Link2, Mail, MessageCircle, Send, Share2, Twitter } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

const ShareMenu = ({ product }) => {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const wrapRef = useRef(null);
  const url = `${window.location.origin}/producto/${product.id}`;
  const title = `${product.name} | Chuchicharas`;
  const message = `${product.name} — ${formatPrice(product.price)} | Chuchicharas`;
  const encodedUrl = encodeURIComponent(url);
  const encodedMessage = encodeURIComponent(message);
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  useEffect(() => {
    if (!open) return undefined;

    const closeOnOutside = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title, text: message, url });
      setOpen(false);
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('No se pudo abrir el menú de compartir');
      }
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Enlace copiado');
      setOpen(false);
    } catch {
      const input = document.createElement('textarea');
      input.value = url;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(input);
      if (copied) {
        toast.success('Enlace copiado');
        setOpen(false);
      } else {
        toast.error('No se pudo copiar el enlace');
      }
    }
  };

  const close = () => setOpen(false);

  const toggleOpen = () => {
    if (!open && wrapRef.current) {
      const trigger = wrapRef.current.querySelector('.share-trigger');
      const rect = trigger?.getBoundingClientRect();
      if (rect) {
        setOpenUp(rect.bottom + 320 > window.innerHeight && rect.top > 320);
      }
    }
    setOpen((value) => !value);
  };

  return (
    <div className="share-wrap" ref={wrapRef}>
      <button
        type="button"
        className="btn btn-ghost share-trigger"
        onClick={toggleOpen}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Share2 size={17} />
        Compartir
      </button>

      {open && (
        <div className={`share-menu ${openUp ? 'up' : ''}`} role="menu" aria-label="Compartir producto">
          {canNativeShare && (
            <button type="button" role="menuitem" onClick={handleNativeShare}>
              <Share2 size={16} /> Más opciones
            </button>
          )}
          <a
            role="menuitem"
            href={`https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`}
            target="_blank"
            rel="noreferrer"
            onClick={close}
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
          <a
            role="menuitem"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noreferrer"
            onClick={close}
          >
            <Facebook size={16} /> Facebook
          </a>
          <a
            role="menuitem"
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedMessage}`}
            target="_blank"
            rel="noreferrer"
            onClick={close}
          >
            <Twitter size={16} /> X / Twitter
          </a>
          <a
            role="menuitem"
            href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`}
            target="_blank"
            rel="noreferrer"
            onClick={close}
          >
            <Send size={16} /> Telegram
          </a>
          <a
            role="menuitem"
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${message}\n\n${url}`)}`}
            onClick={close}
          >
            <Mail size={16} /> Correo electrónico
          </a>
          <button type="button" role="menuitem" onClick={copyLink}>
            <Link2 size={16} /> Copiar enlace
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareMenu;
