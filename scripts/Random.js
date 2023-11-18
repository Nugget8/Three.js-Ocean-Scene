import { MathUtils } from "three";

export class Random
{
    seed = 0;
    state = 0;

    constructor(seed)
    {
        if (seed)
        {
            this.seed = seed;
            this.state = this.Generate(seed);
        }
        else
        {
            this.seed = Math.random();
            this.state = this.Generate(this.seed);
        }
    }

    Next()
    {
        this.state = this.Generate(this.state);
        return this.state;
    }

    Generate(x)
    {
        let n = Math.sin(x * 12.9898) * 43758.5453;
        return n - Math.floor(n);
    }
    
    Generate2D(x, y)
    {
        x += this.seed;
        y += this.seed;

        let n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
        return n - Math.floor(n);
    }
    
    Perlin(x, y)
    {
        function CubicInterpolation(a, b, t)
        {
            t = t * t * t * (t * (t * 6 - 15) + 10);
            return (1 - t) * a + t * b;
        }
    
        let leftX = Math.floor(x);
        let topY = Math.floor(y);
        let rightX = leftX + 1;
        let bottomY = topY + 1;
        let leftOffset = x - leftX;
        let topOffset = y - topY;
        let rightOffset = x - rightX;
        let bottomOffset = y - bottomY;
    
        let topLeftGridValue = this.Generate2D(leftX, topY) * Math.PI * 2;
        let topRightGridValue = this.Generate2D(rightX, topY) * Math.PI * 2;
        let bottomLeftGridValue = this.Generate2D(leftX, bottomY) * Math.PI * 2;
        let bottomRightGridValue = this.Generate2D(rightX, bottomY) * Math.PI * 2;
    
        let topLeftNoiseValue = leftOffset * Math.cos(topLeftGridValue) + topOffset * Math.sin(topLeftGridValue);
        let topRightNoiseValue = rightOffset * Math.cos(topRightGridValue) + topOffset * Math.sin(topRightGridValue);
        let bottomLeftNoiseValue = leftOffset * Math.cos(bottomLeftGridValue) + bottomOffset * Math.sin(bottomLeftGridValue);
        let bottomRightNoiseValue = rightOffset * Math.cos(bottomRightGridValue) + bottomOffset * Math.sin(bottomRightGridValue);
        
        let topNoiseValue = CubicInterpolation(topLeftNoiseValue, topRightNoiseValue, leftOffset);
        let bottomNoiseValue = CubicInterpolation(bottomLeftNoiseValue, bottomRightNoiseValue, leftOffset);
        return MathUtils.clamp(CubicInterpolation(topNoiseValue, bottomNoiseValue, topOffset), -0.7, 0.7) / 0.7;
    }
    
    Ridge(x, y, p)
    {
        return Math.pow(Math.abs(this.Perlin(x, y)), p);
    }
}