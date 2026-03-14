import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function PizzaScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const width = mountRef.current.clientWidth;
    const height = 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(6, 5, 8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;

    mountRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    light.castShadow = true;
    scene.add(light);

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({
        color: 0x8b6f4e,
        roughness: 0.9,
      })
    );

    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Wall
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 10),
      new THREE.MeshStandardMaterial({ color: 0xf5e3c3 })
    );

    wall.position.set(0, 5, -10);
    scene.add(wall);

    // Table
    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 0.3, 32),
      new THREE.MeshStandardMaterial({
        color: 0x5c3a21,
        roughness: 0.8,
      })
    );

    table.position.y = 1;
    table.castShadow = true;
    scene.add(table);

    // Pizza base
    const pizzaBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 0.2, 32),
      new THREE.MeshStandardMaterial({ color: 0xf4c27a })
    );

    pizzaBase.position.y = 1.2;
    pizzaBase.castShadow = true;
    scene.add(pizzaBase);

    // Cheese
    const cheese = new THREE.Mesh(
      new THREE.CylinderGeometry(1.9, 1.9, 0.05, 32),
      new THREE.MeshStandardMaterial({ color: 0xffe066 })
    );

    cheese.position.y = 1.28;
    scene.add(cheese);

    // Pepperoni
    const toppingMaterial = new THREE.MeshStandardMaterial({
      color: 0xb22222,
    });

    for (let i = 0; i < 12; i++) {
      const topping = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16),
        toppingMaterial
      );

      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 1.4;

      topping.position.x = Math.cos(angle) * radius;
      topping.position.z = Math.sin(angle) * radius;
      topping.position.y = 1.32;

      scene.add(topping);
    }

    // Pizza oven
    const oven = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x884422 })
    );

    oven.position.set(-4, 0.75, -3);
    scene.add(oven);

    // Fire light
    const fireLight = new THREE.PointLight(0xff6600, 2, 5);
    fireLight.position.set(-4, 1, -3);
    scene.add(fireLight);

   

    // Resize
    const handleResize = () => {
      const width = mountRef.current.clientWidth;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "500px",
        marginTop: "20px",
      }}
    />
  );
}