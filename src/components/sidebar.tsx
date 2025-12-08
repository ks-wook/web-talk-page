"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage } from "./ui/avatar";
import { User, Message } from "@/app/data";
import React from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "@mui/material/styles"; // MUI 스타일 추가
import api from "@/lib/axios";

interface SidebarProps {
  me: React.RefObject<string>;
  isCollapsed: boolean;
  links: User[];
  setConnectedUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setSelectedUser: React.Dispatch<React.SetStateAction<User | null>>;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const searchResult = (name: string): User => {
  return {
    name,
    messages: [], // 기본값으로 빈 배열
  };
};

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
  return null;
};

export const fetchUsers = async (searchQuery: string): Promise<User[]> => {
  const token = getCookie("onlineOpenChatAuth");

  if (!token) {
    throw new Error("Authentication token not found in cookies");
  }

  // 유저 검색 요청
  const response = await api.get(`/api/v1/user/search/${searchQuery}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true
  });

  console.log('[유저 검색 요청 결과] : ', response);

  const names = response.data.name;

  return names.map((n: string) => searchResult(n));
};

export function Sidebar({
  me,
  links,
  isCollapsed,
  setConnectedUsers,
  setSelectedUser,
  setMessages,
}: SidebarProps) {
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [searchResults, setSearchResults] = React.useState<User[]>([]);

  const handleSearch = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSearchQueryChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const query = event.target.value;

    setSearchQuery(query);
  };

  const handelSearchButton = async (event: any) => {
    const users = await fetchUsers(searchQuery);
    setSearchResults(users);
  };

  const addFriends = async (user: User) => {
    setConnectedUsers((prevUsers) => {
      // user.id가 이미 prevUsers 배열에 있는지 확인
      const userExists = prevUsers.some(
        (existingUser) => existingUser.name === user.name
      );

      if (userExists) {
        // 이미 존재하는 경우 아무것도 하지 않음
        return prevUsers;
      }

      // 존재하지 않는 경우에만 추가
      return [...prevUsers, user];
    });
  };

  const handleChangeChat = async (link: User) => {
    const token = getCookie('onlineOpenChatAuth');

    // TODO : redis를 통해 채팅 로그를 불러들어야함
    const result = await api.get("/api/v1/chat/chat-list", {
      params: {
        name: link.name,
        from: me.current,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true
    });

    setMessages(result.data.result);

    window.localStorage.setItem("selectedUser", JSON.stringify(link));
    setSelectedUser(link);
  };

  return (
    <div
      data-collapsed={isCollapsed}
      className="relative group flex flex-col h-full gap-4 p-2 data-[collapsed=true]:p-2 "
    >
      <Dialog open={showModal} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogContent>
          <div className="flex items-center">
            <TextField
              fullWidth
              placeholder="Search..."
              value={searchQuery}
              onChange={handleSearchQueryChange}
              InputProps={{
                endAdornment: (
                  <IconButton edge="end" color="primary">
                    <SearchIcon onClick={handelSearchButton} />
                  </IconButton>
                ),
              }}
            />
          </div>
          <List>
            {searchResults.length > 0 ? (
              searchResults.map((user, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={user.name}
                    onClick={() => {
                      addFriends(user);
                    }}
                  />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No results found" />
              </ListItem>
            )}
          </List>
        </DialogContent>
      </Dialog>
      {!isCollapsed && (
        <div className="flex justify-between p-2 items-center">
          <div className="flex gap-2 items-center text-2xl">
            <p className="font-medium">Chats</p>
            <span className="text-zinc-300">({links.length})</span>
          </div>

          <div>
            <Link
              href="#"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9"
              )}
            >
              <Search size={20} onClick={handleSearch} />
            </Link>
          </div>
        </div>
      )}
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) =>
          isCollapsed ? (
            <TooltipProvider key={index}>
              <Tooltip key={index} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href="#"
                    className={cn(
                      buttonVariants({ variant: "grey", size: "icon" }),
                      "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                    )}
                  >
                    <span className="sr-only">{link.name}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="flex items-center gap-4"
                >
                  {link.name}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Link
              key={index}
              href="#"
              className={cn(
                buttonVariants({ variant: "grey", size: "xl" }), // link.variant === "grey" &&
                "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white shrink"
              )}
              onClick={() => {
                handleChangeChat(link);
              }}
            >
              <div className="flex flex-col max-w-28">
                <span>{link.name}</span>
                {link.messages.length > 0 && (
                  <span className="text-zinc-300 text-xs truncate ">
                    {link.messages[link.messages.length - 1].name.split(" ")[0]}
                    : {link.messages[link.messages.length - 1].message}
                  </span>
                )}
              </div>
            </Link>
          )
        )}
      </nav>
    </div>
  );
}
