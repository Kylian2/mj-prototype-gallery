/**
 * Safely dispose a Three.js object and its children
 * @param {THREE.Object3D} object - The object to dispose
 * @param {THREE.Scene} scene - The scene containing the object
 */
export function disposeObject(object, scene) {
    try {
        if (!object) return;
        
        // Remove from parent/scene
        if (object.parent) {
            object.parent.remove(object);
        } else if (scene) {
            scene.remove(object);
        }
        
        if (object.children && object.children.length > 0) {
            const children = [...object.children];
            
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                
                if (child.geometry) {
                    child.geometry.dispose();
                }
                
                if (child.material) {
                    const materials = Array.isArray(child.material) ? 
                                      child.material : [child.material];
                    
                    // Dispose each material and its textures
                    materials.forEach(material => {
                        if (!material) return;
                        
                        // Dispose common textures
                        const textureProps = [
                            'map', 'normalMap', 'specularMap', 'emissiveMap',
                            'alphaMap', 'aoMap', 'bumpMap', 'displacementMap',
                            'metalnessMap', 'roughnessMap'
                        ];
                        
                        textureProps.forEach(prop => {
                            if (material[prop]) {
                                material[prop].dispose();
                            }
                        });
                        
                        material.dispose();
                    });
                }
                
                object.remove(child);
            }
        }
        
        if (object.geometry) {
            object.geometry.dispose();
        }
        
        if (object.material) {
            const materials = Array.isArray(object.material) ? 
                              object.material : [object.material];
            
            materials.forEach(material => {
                if (!material) return;
                
                const textureProps = [
                    'map', 'normalMap', 'specularMap', 'emissiveMap',
                    'alphaMap', 'aoMap', 'bumpMap', 'displacementMap',
                    'metalnessMap', 'roughnessMap'
                ];
                
                textureProps.forEach(prop => {
                    if (material[prop]) {
                        material[prop].dispose();
                    }
                });
                
                material.dispose();
            });
        }
        
        if (object.userData) {
            if (object.userData.buttons) object.userData.buttons = [];
            if (object.userData.events) object.userData.events = [];
        }
        
    } catch (error) {
        console.error("Error during object disposal:", error);
    }
}