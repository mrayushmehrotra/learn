# In another directory outside this workspace
npx @nestjs/cli new test-type-check
cd test-type-check
npm i -D @swc/cli @swc/core

# Configure nest-cli.json
cat > nest-cli.json << 'EOF'
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "builder": "swc",
    "typeCheck": true
  }
}
EOF

# Add a type error
echo "const x: number = 'hello';" >> src/main.ts

# Use your local CLI
npm link @nestjs/cli
