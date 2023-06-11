type Matter = {
  type: string
  label: string
}

function TextMatter({ label }: { label: string }): Matter {
  return { type: 'text', label }
}

function SwitchMatter({ label }: { label: string }): Matter {
  return { type: 'switch', label }
}

function NumberMatter({ label }: { label: string }): Matter {
  return { type: 'number', label }
}

const BaseMatter = {
  TextMatter,
  SwitchMatter,
  NumberMatter,
}
