import { WindowProps } from "@/components/WindowManagement/WindowCompositor";
import { useTranslation } from "react-i18next";
import styles from './ContactView.module.css';
import { FormEvent, useEffect, useRef, useState } from "react";
import { isEmail } from "@/components/util";

export default function NotesApplicationView(props: WindowProps) {
  const { application, args, windowContext } = props;
  const nameRef = useRef<HTMLInputElement>(null);

  const { t } = useTranslation('common');

  const [inputFields, setInputFields] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  });

  const [errors, setErrors] = useState({
    email: false
  });

  const [loading, setLoading] = useState(false);
  const [processed, setProcessed] = useState(false);

  function handleChange(e: any) {
    setInputFields({ ...inputFields, [e.target.name]: e.target.value });
  } 

  function resetInput() {
    setInputFields({
      name: "",
      email: "",
      company: "",
      message: ""
    })
  }

  async function sendEmail() {
    const response = await fetch("/api/contact", {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputFields),
    });

    setLoading(false);

    if (response.ok) {
      setProcessed(true);
    }
  }

  function validateForm(): boolean {
    let valid = true;

    if (!isEmail(inputFields.email)) {
      valid = false;
      setErrors({...errors, ['email']: true});
    }
    
    return valid;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();


    setLoading(true);
    setProcessed(false);

    if (validateForm()) { sendEmail().then(() => resetInput()); }
  }

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
            <form onSubmit={onSubmit}>
              { processed ?
                <div className={[styles['form-row'], styles['processed']].join(' ')}>
                  <span>{t("contact.processed")}</span>
                </div> : <></>
              }
              
              <div className={styles['form-row']}>
                <label htmlFor="name">{t("contact.name")}:</label>
                <input
                  className="system-text-input"
                  ref={nameRef}
                  id="name"
                  type="text"
                  name="name"
                  disabled={loading}
                  placeholder={t("contact.name")}
                  value={inputFields.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles['form-row']}>
                <label htmlFor="email">{t("contact.email")}:</label>
                <input
                  className="system-text-input"
                  id="email"
                  type="email"
                  name="email"
                  disabled={loading}
                  placeholder={t("contact.email")}
                  value={inputFields.email}
                  onChange={handleChange}
                  required
                />
                { errors.email ? <span>{t('contact.error.invalid-email')}</span> : <></> }
              </div>

              <div className={styles['form-row']}>
                <label htmlFor="company">{t("contact.company_optional")}:</label>
                <input
                  className="system-text-input"
                  id="company"
                  type="text"
                  name="company"
                  disabled={loading}
                  placeholder={t("contact.company")}
                  value={inputFields.company}
                  onChange={handleChange}
                />
              </div>

              <div className={styles['form-row']}>
                <label htmlFor="message">{t("contact.message")}:</label>
                <textarea
                  className="system-text-input"
                  id="message"
                  name="message"
                  disabled={loading}
                  placeholder={t("contact.message")}
                  value={inputFields.message}
                  onChange={handleChange}
                  required
                  />
              </div>

              <div className={styles['form-row']}>
                <input type="submit" className="system-button" disabled={loading} value={t("contact.send")}/>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
