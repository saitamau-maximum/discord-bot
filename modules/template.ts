export const HELP_TEMPLATE = (
  name: string,
  version: string,
  author: string,
  description: string,
  commands: string
) => `
**${name}** v${version}
${description}
作成者：${author}

コマンド一覧
\`\`\`
${commands}
\`\`\`
`;
