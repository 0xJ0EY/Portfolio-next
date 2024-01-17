import { FileSystemImage } from "@/apis/FileSystem/FileSystem";
import { constructPath } from "@/apis/FileSystem/util";
import { WindowProps } from "@/components/WindowManagement/WindowCompositor";
import Image from 'next/image'
import { useEffect, useState } from "react";
import styles from './ImageViewerView.module.css';
import { useTranslation } from "react-i18next";

function ErrorMessage(message: string) {
  return (
    <div className={styles.container}>
      <div className={['content', styles['text-content']].join(' ')}>
        {message}
      </div>
    </div>
  );
}

export default function ImageViewerView(props: WindowProps) {
  const { application, args, windowContext } = props;
  const [image, setImage] = useState<FileSystemImage>();

  const { t } = useTranslation('common');

  const fs = application.apis.fileSystem;
  const path = args;

  function updateWindowTitle(image: FileSystemImage) {
    const window = application.compositor.getById(windowContext.id);
    if (!window) { return; }

    const path = constructPath(image);

    window.title = `${path} - Image`;

    application.compositor.update(window);
  }

  useEffect(() => {
    const imageNode = fs.getImage(path);
    if (!imageNode.ok) { return; }
    const image = imageNode.value;
    
    const unsubscribe = fs.subscribe(image, (evt) => {
      updateWindowTitle(image);
    });

    setImage(image);
    updateWindowTitle(image);

    return () => { unsubscribe(); }
  }, []);

  if (!path) { return ErrorMessage(t('image.no_image_to_load')); }
  if (!image) { return ErrorMessage(t('image.loading')); }

  return (
    <div className={styles.container}>
      <div className="content">
        <div className={styles.image}>
          <Image
            draggable={false}
            src={image.source}
            fill
            quality={90}
            style={{
              objectFit: 'contain',
            }}
            sizes="400px, 800px, 1024px"
            alt={image.description}
          />
        </div>
      </div>
    </div>
  )
}
