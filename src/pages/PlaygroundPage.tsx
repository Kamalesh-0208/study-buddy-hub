import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Terminal } from "lucide-react";
import CodeRunner, { CodeLanguage } from "@/components/CodeRunner";

const STARTERS: Record<CodeLanguage, string> = {
  python: `# Read input and print output\nname = input()\nprint(f"Hello, {name}!")\n`,
  cpp: `#include <iostream>\nusing namespace std;\nint main(){\n  string name; getline(cin, name);\n  cout << "Hello, " << name << "!" << endl;\n  return 0;\n}\n`,
  c: `#include <stdio.h>\nint main(){\n  char name[128]; if(!fgets(name, 128, stdin)) return 0;\n  printf("Hello, %s", name);\n  return 0;\n}\n`,
  java: `import java.util.*;\npublic class Main {\n  public static void main(String[] args){\n    Scanner sc = new Scanner(System.in);\n    String name = sc.nextLine();\n    System.out.println("Hello, " + name + "!");\n  }\n}\n`,
};

const PlaygroundPage = () => {
  const [language, setLanguage] = useState<CodeLanguage>("python");
  const [code, setCode] = useState<string>(STARTERS.python);
  const [stdin, setStdin] = useState<string>("World");
  const [expected, setExpected] = useState<string>("Hello, World!");

  const handleLangChange = (l: CodeLanguage) => {
    setLanguage(l);
    setCode(STARTERS[l]);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="gradient-bg rounded-xl p-2.5 shadow-glow">
          <Terminal className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Code Playground</h1>
          <p className="text-sm text-muted-foreground">
            Run C, C++, Java & Python in a secure sandbox (2s · 256MB · no network)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Source Code</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-xs min-h-[400px] resize-none"
              spellCheck={false}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Test Case</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Standard Input (stdin)</Label>
              <Textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                className="font-mono text-xs min-h-[120px] resize-none"
                spellCheck={false}
              />
            </div>
            <div>
              <Label className="text-xs">Expected Output</Label>
              <Textarea
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                className="font-mono text-xs min-h-[120px] resize-none"
                spellCheck={false}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <CodeRunner
        language={language}
        onLanguageChange={handleLangChange}
        showLanguageSelector
        sourceCode={code}
        testCases={[{ input: stdin, expected_output: expected }]}
        buttonLabel="Run Code"
      />
    </div>
  );
};

export default PlaygroundPage;
