# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
  ];

  # Sets environment variables in the workspace
  env = {};
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
    ];

    # Enable previews
    previews = {
      enable = true;
      previews = {
        # 設定網頁預覽
        web = {
          # 這裡很重要：告诉系統要進入 Goodi-App 資料夾去執行指令
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--host" "0.0.0.0"];
          cwd = "Goodi-App";
          manager = "web";
        };
      };
    };

    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        # 這裡也要記得進去 Goodi-App 安裝
        npm-install = "cd Goodi-App && npm install"; 
      };
      # Runs when the workspace is (re)started
      onStart = {
        # 這裡也要記得進去 Goodi-App 啟動
        start-web-server = "cd Goodi-App && npm run dev";
      };
    };
  };
}