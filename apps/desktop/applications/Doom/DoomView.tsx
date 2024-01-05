import DosEmulator from "@/components/DosEmulator/DosEmulator";
import { WindowProps } from "@/components/WindowManagement/WindowCompositor";

export default function DoomApplicationView(props: WindowProps) {
  const { application, args, windowContext } = props;

  return DosEmulator({
    gameLocation: '/games/doom.jsdos',
    soundService: application.apis.sound
  });
}
