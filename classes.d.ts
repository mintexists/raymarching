export declare class Position {
    x: number;
    y: number;
    z: number;
    static zero: Position;
    static forward: Position;
    static back: Position;
    static up: Position;
    static down: Position;
    static left: Position;
    static right: Position;
    constructor(x?: number, y?: number, z?: number);
}
export declare class Rotation {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
}
export declare class Color {
    r: number;
    g: number;
    b: number;
    constructor(r: number, g: number, b: number);
}
export declare class Shader {
    color: Color;
    roughness: number;
    absorbtion: number;
    density: number;
    transmission: number;
    ior: number;
    constructor(roughness: number, absorbtion: number, color?: Color, density?: number, transmission?: number, ior?: number);
}
export declare enum ShapeType {
    sphere = 0,
    infPlane = 1,
    box = 2,
    torus = 3,
    mandlebulb = 4,
    plane = 5,
    subtract = 6,
    union = 7,
    intersect = 8,
    infinite = 9,
    hexagonalPrism = 10,
    rotate = 11
}
export declare class Rotate {
    type: ShapeType;
    rotation: Rotation;
    object: any;
    shader: Shader;
    constructor(object: any, rotation: Rotation);
    distance(pos: Position): any;
}
export declare class Sphere {
    type: ShapeType;
    position: Position;
    radius: number;
    shader: Shader;
    constructor(position: Position, radius: number, shader?: Shader);
    distance(pos: Position): number;
}
export declare class Box {
    type: ShapeType;
    position: Position;
    shape: Position;
    shader: Shader;
    constructor(position: Position, shape: Position, shader?: Shader);
    distance(pos: Position): number;
}
export declare class Torus {
    type: ShapeType;
    position: Position;
    major: number;
    minor: number;
    shader: Shader;
    constructor(position: Position, major: number, minor: number, shader?: Shader);
    distance(pos: Position): number;
}
export declare class Plane {
    type: ShapeType;
    position: Position;
    shape: Position;
    shader: Shader;
    constructor(position: Position, shape: Position, shader?: Shader);
    distance(pos: Position): number;
}
export declare class Subtract {
    type: ShapeType;
    subtractor: any;
    subtractee: any;
    shader: Shader;
    constructor(subtractor: any, subtractee: any, shader?: Shader);
    distance(pos: Position): number;
}
export declare class Union {
    type: ShapeType;
    first: any;
    second: any;
    shader: Shader;
    constructor(first: any, second: any, shader?: Shader);
    distance(pos: Position): number;
}
export declare class Intersect {
    type: ShapeType;
    first: any;
    second: any;
    shader: Shader;
    constructor(first: any, second: any, shader?: Shader);
    distance(pos: Position): number;
}
export declare class Infinite {
    type: ShapeType;
    offset: Position;
    object: any;
    shader: Shader;
    constructor(offset: Position, object: any, shader?: Shader);
    distance(pos: Position): any;
}
export declare function processObjects(json: any): any[];
