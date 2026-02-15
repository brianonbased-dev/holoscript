/**
 * VirtualKeyboard.ts
 *
 * Generates a full QWERTY keyboard entity using UIComponents.
 */

import { HSPlusNode, Vector3 } from '../types/HoloScriptPlus';
import { createButton, createPanel } from './UIComponents';

export const createVirtualKeyboard = (
    id: string, 
    position: Vector3, 
    onKey: (key: string) => void
): HSPlusNode => {
    
    // Config
    const keySize = 0.04;
    const spacing = 0.01;
    const rowSpacing = 0.06;
    
    const rows = [
        ['1','2','3','4','5','6','7','8','9','0'],
        ['Q','W','E','R','T','Y','U','I','O','P'],
        ['A','S','D','F','G','H','J','K','L'],
        ['Z','X','C','V','B','N','M', ',', '.']
    ];

    const children: HSPlusNode[] = [];
    
    // Panel Background
    const panelWidth = 10 * (keySize + spacing) + 0.1;
    const panelHeight = 4 * rowSpacing + 0.1;

    // Generate Keys
    rows.forEach((row, rowIndex) => {
        const rowWidth = row.length * (keySize + spacing);
        const startX = -rowWidth / 2;
        const y = (rows.length - 1 - rowIndex) * rowSpacing - (panelHeight / 4);

        row.forEach((key, keyIndex) => {
            const x = startX + keyIndex * (keySize + spacing);
            
            const btn = createButton({
                id: `${id}_key_${key}`,
                text: key,
                position: { x, y, z: 0.01 },
                width: keySize,
                height: keySize,
                depth: 0.01,
                color: '#444'
            });

            // We need to attach the event handler logic.
            // In a real runtime, we'd bind an event name.
            // Here, we might assume the runtime maps button ID -> event.
            // or we add a specific 'onClick' property if supported.
            // For now, ID is sufficient to identify the key in 'ui_press_end'.
            
            children.push(btn);
        });
    });

    // Spacebar Row
    const spaceY = -rowSpacing * 1.5;
    const spaceWidth = 5 * keySize;
    
    // Left Arrow
    children.push(createButton({
        id: `${id}_key_LEFT`,
        text: '<',
        position: { x: -spaceWidth/2 - keySize - spacing, y: spaceY, z: 0.01 },
        width: keySize,
        height: keySize,
        color: '#444'
    }));

    // Space
    children.push(createButton({
        id: `${id}_key_SPACE`,
        text: 'SPACE',
        position: { x: 0, y: spaceY, z: 0.01 },
        width: spaceWidth,
        height: keySize,
        depth: 0.01,
        color: '#444'
    }));

    // Right Arrow
    children.push(createButton({
        id: `${id}_key_RIGHT`,
        text: '>',
        position: { x: spaceWidth/2 + keySize + spacing, y: spaceY, z: 0.01 },
        width: keySize,
        height: keySize,
        color: '#444'
    }));

    // Backspace (End of 4th row)
    // Adjust logic above or just append here manually for now
    children.push(createButton({
        id: `${id}_key_BACKSPACE`,
        text: '←',
        position: { x: (rows[3].length * (keySize+spacing))/2 + keySize, y: -rowSpacing/4 - rowSpacing*2, z: 0.01 },
        width: keySize * 1.5,
        height: keySize,
        color: '#622'
    }));

    return createPanel({
        id,
        position,
        width: panelWidth,
        height: panelHeight + rowSpacing,
        color: '#222',
        children
    });
};
