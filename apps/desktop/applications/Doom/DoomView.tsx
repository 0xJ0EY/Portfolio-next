import { WindowProps } from "@/components/WindowManagement/WindowCompositor";

export default function NotesApplicationView(props: WindowProps) {
  const { application, args, windowContext } = props;

  return (<><iframe style={{width: '100%', height: '100%', display: 'block'}} src="https://roy-van-dijk.github.io/wordclock/"></iframe></>);
}
