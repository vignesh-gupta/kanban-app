import { Router } from "express";
import { z } from "zod";
import { Board } from "../models/Board";
import { List } from "../models/List";
import { Card } from "../models/Card";
import { Comment } from "../models/Comment";
import { Invitation } from "../models/Invitation";
import { AuditLog } from "../models/AuditLog";
import { authenticate, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { sendInvitationEmail } from "../services/email";
import { generateId } from "../utils/helpers";
import mongoose from "mongoose";

const router: Router = Router();

// Get invitation details (no auth required)
router.get("/invitation/:token/details", async (req, res, next) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({
      token,
      status: "pending",
    }).populate([
      {
        path: "boardId",
        select: "title description color owner",
        populate: {
          path: "owner",
          select: "name email",
        },
      },
      {
        path: "invitedBy",
        select: "name email",
      },
    ]);

    if (!invitation) {
      return res
        .status(404)
        .json({ message: "Invitation not found or expired" });
    }

    res.json(invitation);
  } catch (error) {
    next(error);
  }
});

// Apply authentication to all other board routes
router.use(authenticate);

// Validation schemas
const createBoardSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
});

const createListSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  position: z.number().min(0),
});

const createCardSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  listId: z.string(),
  position: z.number().min(0),
  labels: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().max(50),
        color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
      })
    )
    .optional(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
});

const inviteSchema = z.object({
  email: z.string().email("Invalid email format"),
  role: z.enum(["collaborator"]).default("collaborator"),
});

const moveCardSchema = z.object({
  listId: z.string(),
  position: z.number().min(0),
});

// Get all boards for user
router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.user._id }, { "collaborators.user": req.user._id }],
    })
      .populate("owner", "name email avatar")
      .populate("collaborators.user", "name email avatar")
      .sort({ updatedAt: -1 });

    // Get lists for each board
    const boardsWithLists = await Promise.all(
      boards.map(async (board) => {
        const lists = await List.find({ boardId: board._id }).sort({
          position: 1,
        });

        // Get cards for each list
        const listsWithCards = await Promise.all(
          lists.map(async (list) => {
            const cards = await Card.find({ listId: list._id })
              .populate("assignee", "name email avatar")
              .populate("createdBy", "name email avatar")
              .sort({ position: 1 });

            return {
              ...list.toObject(),
              cards,
            };
          })
        );

        return {
          ...board.toObject(),
          lists: listsWithCards,
        };
      })
    );

    res.json(boardsWithLists);
  } catch (error) {
    next(error);
  }
});

// Get single board
router.get("/:boardId", async (req: AuthRequest, res, next) => {
  try {
    const { boardId } = req.params;

    const board = await Board.findById(boardId)
      .populate("owner", "name email avatar")
      .populate("collaborators.user", "name email avatar");

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    // Check if user has access
    const hasAccess =
      board.owner._id.equals(req.user._id) ||
      board.collaborators.some((collab) =>
        collab.user._id.equals(req.user._id)
      );

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get lists with cards
    const lists = await List.find({ boardId }).sort({ position: 1 });

    const listsWithCards = await Promise.all(
      lists.map(async (list) => {
        const cards = await Card.find({ listId: list._id })
          .populate("assignee", "name email avatar")
          .populate("createdBy", "name email avatar")
          .sort({ position: 1 });

        // Get comments for each card
        const cardsWithComments = await Promise.all(
          cards.map(async (card) => {
            const comments = await Comment.find({ cardId: card._id })
              .populate("author", "name email avatar")
              .sort({ createdAt: 1 });

            return {
              ...card.toObject(),
              comments,
            };
          })
        );

        return {
          ...list.toObject(),
          cards: cardsWithComments,
        };
      })
    );

    res.json({
      ...board.toObject(),
      lists: listsWithCards,
    });
  } catch (error) {
    next(error);
  }
});

// Create board
router.post(
  "/",
  validate(createBoardSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { title, description, color } = req.body;

      const board = new Board({
        title,
        description,
        color,
        owner: req.user._id,
        collaborators: [],
      });

      await board.save();
      await board.populate("owner", "name email avatar");

      // Create audit log
      await new AuditLog({
        action: "board_created",
        user: req.user._id,
        board: board._id,
        details: `Created board "${title}"`,
      }).save();

      res.status(201).json({
        ...board.toObject(),
        lists: [],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create list
router.post(
  "/:boardId/lists",
  validate(createListSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { boardId } = req.params;
      const { title, position } = req.body;

      // Check if user has access to board
      const board = await Board.findById(boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      const hasAccess =
        board.owner.equals(req.user._id) ||
        board.collaborators.some((collab) => collab.user.equals(req.user._id));

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const isSameTitle = await List.findOne({ title, boardId });

      console.log({
        isSameTitle,
      });

      if (isSameTitle) {
        return res
          .status(409)
          .json({ message: "Same List is present in the board" });
      }

      const list = new List({
        title,
        boardId,
        position,
      });

      await list.save();

      // Create audit log
      await new AuditLog({
        action: "list_created",
        user: req.user._id,
        board: boardId,
        details: `Created list "${title}"`,
      }).save();

      res.status(201).json({
        ...list.toObject(),
        cards: [],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete list
router.delete("/lists/:listId", async (req: AuthRequest, res, next) => {
  try {
    const { listId } = req.params;

    const list = await List.findById(listId);

    if (!list) {
      return res.status(404).json({ message: "List not found" });
    }

    await List.deleteOne({ id: listId });

    return res.json({ message: "List Deleted" });
  } catch (error) {
    next(error);
  }
});

// Create card
router.post(
  "/:boardId/cards",
  validate(createCardSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { boardId } = req.params;
      const {
        title,
        description,
        listId,
        position,
        labels,
        assignee,
        dueDate,
      } = req.body;

      // Check if user has access to board
      const board = await Board.findById(boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      const hasAccess =
        board.owner.equals(req.user._id) ||
        board.collaborators.some((collab) => collab.user.equals(req.user._id));

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const card = new Card({
        title,
        description,
        listId,
        boardId,
        position,
        labels: labels || [],
        assignee: assignee || [],
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdBy: req.user._id,
      });

      await card.save();
      await card.populate([
        { path: "assignee", select: "name email avatar" },
        { path: "createdBy", select: "name email avatar" },
      ]);

      // Create audit log
      await new AuditLog({
        action: "card_created",
        user: req.user._id,
        board: boardId,
        details: `Created card "${title}"`,
      }).save();

      res.status(201).json({
        ...card.toObject(),
        comments: [],
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update card
router.put("/cards/:cardId", async (req: AuthRequest, res, next) => {
  try {
    const { cardId } = req.params;
    const { title, description, labels, assignee, dueDate } = req.body;

    // Find the card first
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    // Check if user has access to the board
    const board = await Board.findById(card.boardId);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const hasAccess =
      board.owner.equals(req.user._id) ||
      board.collaborators.some((collab) => collab.user.equals(req.user._id));

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update the card
    const updatedCard = await Card.findByIdAndUpdate(
      cardId,
      {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(labels !== undefined && { labels }),
        ...(assignee !== undefined && { assignee }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
      },
      { new: true }
    ).populate([
      { path: "assignee", select: "name email avatar" },
      { path: "createdBy", select: "name email avatar" },
    ]);

    if (!updatedCard) {
      return res.status(404).json({ message: "Card not found" });
    }

    // Get comments for the card
    const comments = await Comment.find({ cardId: updatedCard._id })
      .populate("author", "name email avatar")
      .sort({ createdAt: 1 });

    // Create audit log
    await new AuditLog({
      action: "card_updated",
      user: req.user._id,
      board: card.boardId,
      details: `Updated card "${updatedCard.title}"`,
    }).save();

    res.json({
      ...updatedCard.toObject(),
      comments,
    });
  } catch (error) {
    next(error);
  }
});

// Add comment to card
router.post("/cards/:cardId/comments", async (req: AuthRequest, res, next) => {
  try {
    const { cardId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    // Find the card first
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    // Check if user has access to the board
    const board = await Board.findById(card.boardId);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const hasAccess =
      board.owner.equals(req.user._id) ||
      board.collaborators.some((collab) => collab.user.equals(req.user._id));

    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Create the comment
    const comment = new Comment({
      content: content.trim(),
      cardId,
      author: req.user._id,
    });

    await comment.save();
    await comment.populate("author", "name email avatar");

    // Create audit log
    await new AuditLog({
      action: "comment_added",
      user: req.user._id,
      board: card.boardId,
      details: `Added comment to card "${card.title}"`,
    }).save();

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
});

// Move card
router.put(
  "/cards/:cardId/move",
  validate(moveCardSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { cardId } = req.params;
      const { listId, position } = req.body;

      // Find the card first
      const card = await Card.findById(cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      // Check if user has access to the board
      const board = await Board.findById(card.boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      const hasAccess =
        board.owner.equals(req.user._id) ||
        board.collaborators.some((collab) => collab.user.equals(req.user._id));

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Update the card position and list
      const updatedCard = await Card.findByIdAndUpdate(
        cardId,
        { listId, position },
        { new: true }
      ).populate([
        { path: "assignee", select: "name email avatar" },
        { path: "createdBy", select: "name email avatar" },
      ]);

      if (!updatedCard) {
        return res.status(404).json({ message: "Card not found" });
      }

      // Get comments for the card
      const comments = await Comment.find({ cardId: updatedCard._id })
        .populate("author", "name email avatar")
        .sort({ createdAt: 1 });

      // Create audit log
      await new AuditLog({
        action: "card_moved",
        user: req.user._id,
        board: card.boardId,
        details: `Moved card "${card.title}"`,
      }).save();

      res.json({
        ...updatedCard.toObject(),
        comments,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Invite user to board
router.post(
  "/:boardId/invite",
  validate(inviteSchema),
  async (req: AuthRequest, res, next) => {
    try {
      const { boardId } = req.params;
      const { email, role } = req.body;

      // Check if user is board owner
      const board = await Board.findById(boardId).populate(
        "owner",
        "name email"
      );
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      if (!board.owner._id.equals(req.user._id)) {
        return res
          .status(403)
          .json({ message: "Only board owners can invite users" });
      }

      // Check if user is already a collaborator
      const existingCollaborator = board.collaborators.find((collab) =>
        collab.user.equals(req.user._id)
      );
      if (existingCollaborator) {
        return res
          .status(400)
          .json({ message: "User is already a collaborator" });
      }

      // Check if invitation already exists
      const existingInvitation = await Invitation.findOne({
        boardId,
        email,
        status: "pending",
      });
      if (existingInvitation) {
        return res.status(400).json({ message: "Invitation already sent" });
      }

      // Create invitation
      const token = generateId();
      const invitation = new Invitation({
        boardId,
        email,
        role,
        token,
        invitedBy: req.user._id,
      });

      await invitation.save();

      // Send invitation email
      try {
        await sendInvitationEmail(email, board.title, token, req.user.name);
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
        // Don't fail the request if email fails
      }

      // Create audit log
      await new AuditLog({
        action: "user_invited",
        user: req.user._id,
        board: boardId,
        details: `Invited ${email} to board`,
      }).save();

      res.status(201).json({ message: "Invitation sent successfully" });
    } catch (error) {
      next(error);
    }
  }
);

//Accept invitation
router.post(
  "/invitation/:token/accept",
  async (req: AuthRequest, res, next) => {
    try {
      const { token } = req.params;
      const invitation = await Invitation.findOne({
        token,
        status: "pending",
      }).populate("boardId invitedBy", "title owner");
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      if (invitation.email !== req.user.email) {
        return res
          .status(403)
          .json({ message: "You are not invited to this board" });
      }
      // Check if user is already a collaborator
      const board = await Board.findById(invitation.boardId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }
      const existingCollaborator = board.collaborators.find((collab) =>
        collab.user.equals(req.user._id)
      );
      if (existingCollaborator) {
        return res
          .status(400)
          .json({ message: "You are already a collaborator on this board" });
      }
      // Add user as collaborator
      board.collaborators.push({
        user: req.user._id,
        role: invitation.role,
        joinedAt: new Date(),
      });

      await board.save();

      // Update invitation status
      invitation.status = "accepted";
      await invitation.save();

      // Create audit log
      await new AuditLog({
        action: "invitation_accepted",
        user: req.user._id,
        board: invitation.boardId,
        details: `Accepted invitation to board "${board.title}"`,
      }).save();
      res.status(200).json({ message: "Invitation accepted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

// Reject invitation
router.post(
  "/invitation/:token/reject",
  async (req: AuthRequest, res, next) => {
    try {
      const { token } = req.params;
      const invitation = await Invitation.findOne({
        token,
        status: "pending",
      });
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      if (invitation.email !== req.user.email) {
        return res
          .status(403)
          .json({ message: "You are not invited to this board" });
      }

      invitation.deleteOne();

      // Create audit log
      await new AuditLog({
        action: "invitation_rejected",
        user: req.user._id,
        board: invitation.boardId,
        details: `Rejected invitation to board "${invitation.boardId}"`,
      }).save();
      res.status(200).json({ message: "Invitation rejected successfully" });
    } catch (error) {
      next(error);
    }
  }
);

// Delete board
router.delete("/:boardId", async (req: AuthRequest, res, next) => {
  try {
    const { boardId } = req.params;
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }
    // Check if user is board owner
    if (!board.owner.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only board owners can delete boards" });
    }
    // Delete all lists and cards associated with the board

    await Promise.allSettled([
      List.deleteMany({ boardId }),
      Card.deleteMany({ boardId }),
      Comment.deleteMany({ boardId }),
      Invitation.deleteMany({ boardId }),
      board.deleteOne(),
      new AuditLog({
        action: "board_deleted",
        user: req.user._id,
        board: boardId,
        details: `Deleted board "${board.title}"`,
      }).save(),
    ]);

    // Delete the board

    // Create audit log
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as boardRoutes };
