flocal opt = vim.opt

-- General
opt.mouse = "a" -- Enable mouse support
opt.clipboard = "unnamedplus" -- Use system clipboard
opt.swapfile = false -- Don't use swap files
opt.undofile = true -- Enable persistent undo
opt.undodir = vim.fn.stdpath("data") .. "/undo"

-- UI
opt.number = true -- Show line numbers
opt.relativenumber = true -- Show relative line numbers
opt.cursorline = true -- Highlight current line
opt.termguicolors = true -- Enable true colors
opt.signcolumn = "yes" -- Always show sign column
opt.showmode = false -- Don't show mode in command line
opt.scrolloff = 8 -- Keep 8 lines above/below cursor
opt.sidescrolloff = 8 -- Keep 8 columns left/right of cursor
opt.splitbelow = true -- Open horizontal splits below
opt.splitright = true -- Open vertical splits to the right

-- Search
opt.ignorecase = true -- Case insensitive search
opt.smartcase = true -- Case sensitive when uppercase present
opt.hlsearch = true -- Highlight search results
opt.incsearch = true -- Show search results as you type

-- Indentation
opt.expandtab = true -- Use spaces instead of tabs
opt.shiftwidth = 2 -- Size of an indent
opt.tabstop = 2 -- Number of spaces a tab counts for
opt.softtabstop = 2 -- Number of spaces a tab counts for while editing
opt.smartindent = true -- Smart autoindenting

-- Performance
opt.updatetime = 300 -- Faster completion
opt.timeoutlen = 500 -- Time to wait for a mapped sequence
opt.ttimeoutlen = 0 -- Time to wait for a key code sequence

-- Folding
opt.foldmethod = "indent" -- Fold based on indentation
opt.foldlevel = 99 -- Don't fold by default 