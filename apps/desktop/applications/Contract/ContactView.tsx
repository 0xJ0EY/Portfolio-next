import { WindowProps } from "@/components/WindowManagement/WindowCompositor";
import { useTranslation } from "react-i18next";
import styles from './ContactView.module.css';
import { FormEvent, useEffect, useRef, useState } from "react";
import { isEmail, isEmpty } from "@/components/util";

type ValidationError = (
  'empty-name' |
  'empty-email' |
  'empty-message' |
  'invalid-email'
);

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

  const [errors, setErrors] = useState<Set<ValidationError>>(new Set());

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

  function isFormValid(): boolean {
    return validateForm().length === 0;
  }

  function validateForm(): ValidationError[] {
    let errors: ValidationError[] = [];

    if (isEmpty(inputFields.name)) { errors.push('empty-name'); }
    if (isEmpty(inputFields.email)) { errors.push('empty-email'); }
    if (isEmpty(inputFields.message)) { errors.push('empty-message'); }

    if (!isEmail(inputFields.email)) { errors.push('invalid-email'); }
    
    return errors;
  }

  function handleFromErrors() {
    const errors = validateForm();

    function setError(error: ValidationError) {
      setErrors(errors => new Set(errors).add(error));
    }

    for (const error of errors) {
      setError(error);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();

    setLoading(true);
    setProcessed(false);

    if (isFormValid()) {
      sendEmail().then(() => resetInput());
    } else {
      handleFromErrors();
    }
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
                <label htmlFor="name"><span className={styles.required}>*</span>{t("contact.name")}:</label>
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
                <label htmlFor="email"><span className={styles.required}>*</span>{t("contact.email")}:</label>
                <input
                  className="system-text-input"
                  id="email"
                  type="email"
                  name="email"
                  disabled={loading}
                  placeholder={t("contact.email")}
                  value={inputFields.email}
                  onChange={handleChange}
                />
                { errors.has('invalid-email') ? <span>{t('contact.error.invalid-email')}</span> : <></> }
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
                <label htmlFor="message"><span className={styles.required}>*</span>{t("contact.message")}:</label>
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
                <input type="submit" className="system-button" disabled={!isFormValid() || loading} value={t("contact.send")}/>
                
                <div className={styles['instructions']}>
                  <span>{t("contact.message_forwarding_instructions")}</span>
                  <span className={styles['required-instructions']}><span className={styles.required}>*</span> = {t("contact.required")}</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
