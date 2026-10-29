import { VStack, HStack, ZStack, Text, Button, Spacer, Image, Circle } from "@juno/ui";
import type { ColorValue } from "@juno/ui";
import { useState } from "@juno/runtime";
import { RealityView } from "@juno/realitykit";
import { VillageGame } from "../game";
const game = new VillageGame();
// Game controls retain the same contrast over the world in either appearance.
const hud: { glass: ColorValue; edge: ColorValue; ink: ColorValue } = {
  glass: [0.07, 0.12, 0.1, 0.48],
  edge: [1, 0.96, 0.83, 0.3],
  ink: [1, 0.96, 0.83],
};
export function VillageScreen() {
  const [context, setContext] = useState("");
  const [dialogue, setDialogue] = useState("");
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  function currentContext() {
    const npc = game.npcs.find(
      (p) => Math.hypot(p.position.x - game.x, p.position.z - game.z) < 2.7,
    );
    return (game.inside?.two ? "stairs" : "") + "|" + (npc?.name || "");
  }
  function sync() {
    setContext(currentContext());
  }
  function icon(symbol: string, name: string, label: string, action: () => void, size = 48) {
    return (
      <Button
        name={name}
        accessibilityLabel={label}
        style="plain"
        width={size}
        height={size}
        backgroundColor={hud.glass}
        borderColor={hud.edge}
        borderWidth={1}
        cornerRadius={size / 2}
        onPress={action}
      >
        <Image systemName={symbol} fontSize={size === 36 ? 15 : 21} foregroundColor={hud.ink} />
      </Button>
    );
  }
  const [stairs, npc] = context.split("|");
  return (
    <ZStack maxWidth="infinity" maxHeight="infinity">
      <RealityView
        name="VillageWorld"
        scene={game.scene.snapshot(game.camera)}
        ignoresSafeArea
        maxWidth="infinity"
        maxHeight="infinity"
        onUpdate={(e) => {
          if (game.update(e.value)) game.scene.invalidate();
          const next = currentContext();
          if (next !== context) setContext(next);
        }}
        onTap={(e) => {
          setDialogue("");
          game.walkTo(e.value.point[0], e.value.point[2]);
        }}
        onDrag={(e) => {
          setDialogue("");
          if (e.value.phase === "ended" || e.value.phase === "cancelled")
            game.stick = { x: 0, z: 0 };
          else {
            game.target = null;
            const x = e.value.translation.x / 55,
              y = e.value.translation.y / 55;
            game.stick = { x: x * 0.86 + y * 0.5, z: y * 0.86 - x * 0.5 };
          }
        }}
      />
      <VStack padding={{ leading: 24, trailing: 24, top: 8, bottom: 20 }} spacing={16}>
        <HStack>
          <Spacer />
          {icon(
            "door.left.hand.open",
            "VisitInn",
            "Walk to the inn",
            () => {
              setDialogue("");
              game.visitInn();
            },
            36,
          )}
          {icon(
            "arrow.counterclockwise",
            "RestartVillage",
            "Restart village",
            () => {
              game.reset();
              setDialogue("");
              sync();
            },
            36,
          )}
        </HStack>
        <Spacer />
        {dialogue ? (
          <Button
            name="DismissDialogue"
            style="plain"
            onPress={() => setDialogue("")}
            padding={16}
            backgroundColor={hud.glass}
            cornerRadius={12}
          >
            <Text fontSize={16} foregroundColor={hud.ink}>
              {dialogue}
            </Text>
          </Button>
        ) : null}
        <HStack alignment="bottom">
          <ZStack
            name="MovementStick"
            accessibilityLabel="Drag to move"
            width={112}
            height={112}
            onDragChanged={(e) => {
              setDialogue("");
              game.target = null;
              game.route = [];
              const dx = e.value.translation.width,
                dy = e.value.translation.height,
                len = Math.max(1, Math.hypot(dx, dy) / 32),
                x = dx / len,
                y = dy / len;
              setKnob({ x, y });
              game.stick = { x: (x * 0.86 + y * 0.5) / 32, z: (y * 0.86 - x * 0.5) / 32 };
            }}
            onDragEnded={() => {
              game.stick = { x: 0, z: 0 };
              setKnob({ x: 0, y: 0 });
            }}
          >
            <Circle fill={hud.glass} stroke={hud.edge} strokeWidth={1} width={112} height={112} />
            <Circle
              fill={[1, 0.96, 0.83, 0.5]}
              stroke={hud.edge}
              strokeWidth={1}
              width={44}
              height={44}
              offset={knob}
            />
          </ZStack>
          <Spacer />
          <VStack spacing={12}>
            {stairs
              ? icon(
                  game.floor ? "arrow.down" : "arrow.up",
                  "UseStairs",
                  game.floor ? "Go downstairs" : "Go upstairs",
                  () => {
                    setDialogue("");
                    game.stairs();
                    sync();
                  },
                )
              : null}
            {npc
              ? icon("bubble.left.fill", "TalkToVillager", "Talk to " + npc, () => {
                  game.interact();
                  setDialogue(game.message);
                })
              : null}
          </VStack>
        </HStack>
      </VStack>
    </ZStack>
  );
}
