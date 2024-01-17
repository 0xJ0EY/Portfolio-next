import { WindowProps } from "@/components/WindowManagement/WindowCompositor";
import { useTranslation } from "react-i18next";
import styles from './ContactView.module.css';
import { useEffect, useRef } from "react";

export default function NotesApplicationView(props: WindowProps) {
  const { application, args, windowContext } = props;
  const nameRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation('common');

  useEffect(() => {
    if (!nameRef.current) { return; }

    nameRef.current.focus();
  }, []);

  return (
    <div className="content-outer">
      <div className="content">
        <div className={styles['center']}>
          <div className={styles['center-content']}>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestiae quo voluptate vitae est voluptatibus quod architecto qui tenetur vel, velit, molestias deleniti itaque consequuntur reprehenderit maxime et magni laudantium sed!
            </p>
            <form>
              <div className={styles['form-row']}>
                <label htmlFor="name">{t("contact.name")}:</label>
                <input className="system-text-input" ref={nameRef} id="name" type="text" name="name" placeholder={t("contact.name")} required />
              </div>

              <div className={styles['form-row']}>
                <label htmlFor="email">{t("contact.email")}:</label>
                <input className="system-text-input" id="email" type="email" name="email" placeholder={t("contact.email")} required />
              </div>

              <div className={styles['form-row']}>
                <label htmlFor="company">{t("contact.company_optional")}:</label>
                <input className="system-text-input" id="company" type="text" name="name" placeholder={t("contact.company")} />
              </div>

              <div className={styles['form-row']}>
                <label htmlFor="message">{t("contact.message")}:</label>
                <textarea className="system-text-input" id="message" name="message" placeholder={t("contact.message")} required />
              </div>

              <div className={styles['form-row']}>
                <input type="submit" className="system-button" value={t("contact.send")}/>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
