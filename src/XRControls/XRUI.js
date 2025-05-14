import * as THREE from 'three';
import ThreeMeshUI from 'three-mesh-ui';

/**
 * Creates an interactive 3D button using ThreeMeshUI
 * 
 * @param {object} options - Configuration options for the button
 * @param {string} [options.text="Click"] - Text content
 * @param {number} [options.width=0.4] - Width
 * @param {number} [options.height=0.15] - Height
 * @param {number} [options.fontSize=0.05] - Font size
 * @param {THREE.Color} [options.backgroundColor=new THREE.Color(0x5d3fd3)] - Default color
 * @param {THREE.Color} [options.hoverColor=new THREE.Color(0x7353ff)] - Color when hovered
 * @param {THREE.Color} [options.selectedColor=new THREE.Color(0x9376ff)] - Color when selected/clicked
 * @param {THREE.Vector3} [options.position=new THREE.Vector3(0, 1.5, -1)] - Position of the button
 * @param {Function} [options.callback=() => console.log("Button clicked!")] - Function to execute when button is clicked
 * @returns {ThreeMeshUI.Block} - The created button object
 */
export function createButton(options = {}) {
    const {
        text = "Click",
        width = 0.4,
        height = 0.15,
        fontSize = 0.05,
        backgroundColor = new THREE.Color(0x5d3fd3),
        hoverColor = new THREE.Color(0x7353ff),
        selectedColor = new THREE.Color(0x9376ff),
        position = new THREE.Vector3(0, 1.5, -1),
        callback = () => console.log("Button clicked!")
    } = options;

    const button = new ThreeMeshUI.Block({
        width: width,
        height: height,
        padding: 0.02,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 0.025,
        backgroundColor: backgroundColor,
        backgroundOpacity: 1,
        fontFamily: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json',
        fontTexture: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png',
    });

    // Store user data for interaction management
    button.userData = {
        isInteractive: true, // Mark this object as interactive for raycasting
        interactionCallback: callback,
        currentColor: backgroundColor.clone()
    };

    const buttonText = new ThreeMeshUI.Text({
        content: text,
        fontSize: fontSize,
        fontColor: new THREE.Color(0xffffff)
    });
    button.add(buttonText);
    button.position.copy(position);

    const darkenColor = (color, factor = 0.2) => {
        const darkerColor = color.clone();
        let hsl = {};
        darkerColor.getHSL(hsl);
        hsl.l = Math.max(0, hsl.l - factor);
        darkerColor.setHSL(hsl.h, hsl.s, hsl.l);
        return darkerColor;
    };

    // Configure interaction states
    // Default idle state
    button.setupState({
        state: "idle",
        onSet: () => {
            button.set({
                backgroundColor: button.userData.currentColor
            });
        }
    });

    // Hover state - when pointer is over the button
    button.setupState({
        state: "hovered",
        onSet: () => {
            button.set({
                backgroundColor: darkenColor(button.userData.currentColor, 0.1)
            });
        }
    });

    // Selected/clicked state
    button.setupState({
        state: "selected",
        attributes: {
            backgroundColor: darkenColor(button.userData.currentColor, 0.2),
        },
        onSet: () => {
            callback();
        }
    });

    button.setupState({
        state: "on",
        attributes: {
            backgroundColor: new THREE.Color(0x8ac926),
        },
        onSet: () => {
            button.userData.currentColor = new THREE.Color(0x8ac926);
        }
    });

    button.setupState({
        state: "off",
        attributes: {
            backgroundColor: new THREE.Color(0xd62828),
        },
        onSet: () => {
            button.userData.currentColor = new THREE.Color(0xd62828);
        }
    });

    return button;
}

/**
 * Creates a text panel with optional title and buttons using ThreeMeshUI
 * 
 * @param {object} config - Configuration options for the panel
 * @param {number} [config.width=1.2] - Width of the panel
 * @param {number} [config.height=0.8] - Height of the panel
 * @param {string} [config.title="Title"] - Panel title text
 * @param {string} [config.content="Panel content"] - Main content text
 * @param {THREE.Vector3} [config.position=new THREE.Vector3(0, 1.5, -1)] - 3D position of the panel
 * @param {THREE.Euler} [config.rotation=new THREE.Euler(0, 0, 0)] - Rotation of the panel
 * @param {number} [config.fontSize=0.05] - Base font size for text
 * @param {THREE.Color} [config.backgroundColor=new THREE.Color(0x2c3e50)] - Panel background color
 * @param {number} [config.textColor=0xffffff] - Color for all text in the panel
 * @param {Array} [config.buttons=[]] - Array of button configurations to add to the panel
 * @returns {ThreeMeshUI.Block} - The created panel object with references to buttons
 */
export function createPanel(config) {
    // Extract configuration with default values
    const {
        width = 1.2,
        height = 0.8,
        title = "Title",
        content = "Panel content",
        position = new THREE.Vector3(0, 1.5, -1),
        rotation = new THREE.Euler(0, 0, 0),
        fontSize = 0.05,
        backgroundColor = new THREE.Color(0x2c3e50),
        textColor = 0xffffff,
        buttons = []
    } = config;

    const panel = new ThreeMeshUI.Block({
        width: width,
        height: height,
        padding: 0.05,
        borderRadius: 0.05,
        justifyContent: 'start',
        alignItems: 'center',
        fontFamily: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json',
        fontTexture: 'https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png',
        backgroundColor: backgroundColor,
        backgroundOpacity: 0.9
    });

    const titleBlock = new ThreeMeshUI.Block({
        width: width - 0.1,
        height: 0.15,
        justifyContent: 'center',
        backgroundColor: new THREE.Color(0x34495e),
        marginBottom: 0.05
    });

    titleBlock.add(
        new ThreeMeshUI.Text({
            content: title,
            fontSize: fontSize * 1.2,
            fontColor: new THREE.Color(textColor)
        })
    );

    const contentBlock = new ThreeMeshUI.Block({
        width: width - 0.1,
        height: height - 0.3 - (buttons.length > 0 ? 0.15 : 0), // Adjust height if buttons exist
        textAlign: 'left',
        justifyContent: 'start',
        padding: 0.03
    });

    contentBlock.add(
        new ThreeMeshUI.Text({
            content: content,
            fontSize: fontSize,
            fontColor: new THREE.Color(textColor)
        })
    );

    // Variables for button container and button references
    let buttonsContainer;
    let UIButtons = [];
    
    if (buttons.length > 0) {
        buttonsContainer = new ThreeMeshUI.Block({
            width: width - 0.1,
            height: 0.15,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: new THREE.Color(backgroundColor),
            backgroundOpacity: 0.0, // Transparent 
            margin: 0.05,
            padding: 0.02
        });

        buttons.forEach((buttonConfig, index) => {
            // Calculate width to evenly distribute buttons
            const buttonWidth = (width - 0.2) / buttons.length;
            
            const button = new ThreeMeshUI.Block({
                width: buttonWidth - 0.05,
                height: 0.12,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 0.025,
                backgroundColor: buttonConfig.backgroundColor || new THREE.Color(0x5d3fd3),
                margin: 0.01
            });

            const buttonText = new ThreeMeshUI.Text({
                content: buttonConfig.text || `Button ${index + 1}`,
                fontSize: buttonConfig.fontSize || fontSize * 0.9,
                fontColor: new THREE.Color(0xffffff)
            });

            button.add(buttonText);

            // Default idle state
            button.setupState({
                state: "idle",
                attributes: {
                    backgroundColor: buttonConfig.backgroundColor || new THREE.Color(0x5d3fd3)
                }
            });

            // Hover state
            button.setupState({
                state: "hovered",
                attributes: {
                    backgroundColor: buttonConfig.hoverColor || new THREE.Color(0x7353ff)
                },
            });

            // Selected/clicked state
            button.setupState({
                state: "selected",
                attributes: {
                    backgroundColor: buttonConfig.selectedColor || new THREE.Color(0x9376ff)
                },
                onSet: () => {
                    // Execute button's callback when clicked
                    if (buttonConfig.callback) {
                        buttonConfig.callback();
                    }
                }
            });

            // Add button to container and store reference
            buttonsContainer.add(button);
            UIButtons.push(button);
        });
    }

    if (buttons.length > 0) {
        panel.add(titleBlock, contentBlock, buttonsContainer);
    } else {
        panel.add(titleBlock, contentBlock);
    }
    
    // Set panel position and rotation in 3D space
    panel.position.copy(position);
    panel.rotation.copy(rotation);
    
    panel.userData.buttons = UIButtons;

    return panel;
}